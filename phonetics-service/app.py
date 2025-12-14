"""
Phonetics Analysis Service using Praat (parselmouth)
Provides accurate formant extraction and phonetic analysis
"""
import os
import tempfile
import base64
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import parselmouth
import numpy as np

app = FastAPI(title="Phonetics Analysis Service", version="1.0.0")

# CORS middleware для работы с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Обработчик ошибок валидации для отладки"""
    print(f"Validation error: {exc.errors()}")
    print(f"Request body: {await request.body()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(await request.body())}
    )


class FormantAnalysis(BaseModel):
    """Результат анализа формант"""
    f1: Optional[float] = None
    f2: Optional[float] = None
    f3: Optional[float] = None
    f4: Optional[float] = None
    f0: Optional[float] = None  # Основной тон
    bandwidth_f1: Optional[float] = None
    bandwidth_f2: Optional[float] = None


class PhonemeAnalysisRequest(BaseModel):
    """Запрос на анализ фонемы"""
    audio_data: str  # Base64 encoded audio
    audio_format: str = "wav"
    phoneme: Optional[str] = None
    start_time: Optional[float] = None  # Начало сегмента в секундах
    end_time: Optional[float] = None   # Конец сегмента в секундах
    
    class Config:
        # Разрешаем дополнительные поля для обратной совместимости
        extra = "ignore"


class PhonemeAnalysisResponse(BaseModel):
    """Ответ с анализом фонемы"""
    success: bool
    formants: FormantAnalysis
    sample_rate: int
    duration: float
    message: Optional[str] = None


def extract_formants_praat(
    sound: parselmouth.Sound,
    time_point: Optional[float] = None,
    max_formant: float = 5500.0,
    number_of_formants: int = 4
) -> FormantAnalysis:
    """
    Извлекает форманты используя Praat LPC анализ
    
    Args:
        sound: Parselmouth Sound объект
        time_point: Временная точка для анализа (середина по умолчанию)
        max_formant: Максимальная частота для поиска формант (Hz)
        number_of_formants: Количество формант для поиска
    
    Returns:
        FormantAnalysis с найденными формантами
    """
    if time_point is None:
        time_point = sound.duration / 2.0
    
    # Создаем Formant объект используя LPC анализ
    formant = sound.to_formant_burg(
        time_step=0.01,
        max_number_of_formants=number_of_formants,
        maximum_formant=max_formant,
        window_length=0.025,
        pre_emphasis_from=50.0
    )
    
    # Извлекаем форманты в указанной временной точке
    f1 = formant.get_value_at_time(1, time_point) if formant.get_number_of_formants(time_point) >= 1 else None
    f2 = formant.get_value_at_time(2, time_point) if formant.get_number_of_formants(time_point) >= 2 else None
    f3 = formant.get_value_at_time(3, time_point) if formant.get_number_of_formants(time_point) >= 3 else None
    f4 = formant.get_value_at_time(4, time_point) if formant.get_number_of_formants(time_point) >= 4 else None
    
    # Извлекаем bandwidth (ширина полосы) для F1 и F2
    bandwidth_f1 = formant.get_bandwidth_at_time(1, time_point) if f1 else None
    bandwidth_f2 = formant.get_bandwidth_at_time(2, time_point) if f2 else None
    
    # Извлекаем основной тон (F0) используя Pitch
    pitch = sound.to_pitch_ac(
        time_step=0.01,
        pitch_floor=75.0,
        pitch_ceiling=600.0
    )
    f0 = pitch.get_value_at_time(time_point) if pitch else None
    
    return FormantAnalysis(
        f1=f1,
        f2=f2,
        f3=f3,
        f4=f4,
        f0=f0,
        bandwidth_f1=bandwidth_f1,
        bandwidth_f2=bandwidth_f2
    )


def decode_audio_from_base64(audio_data: str, audio_format: str) -> bytes:
    """Декодирует base64 аудио данные"""
    try:
        # Убираем data URL префикс если есть
        if ',' in audio_data:
            audio_data = audio_data.split(',')[1]
        return base64.b64decode(audio_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decode base64 audio: {str(e)}")


def load_audio_from_bytes(audio_bytes: bytes, audio_format: str) -> parselmouth.Sound:
    """Загружает аудио из bytes в Parselmouth Sound объект"""
    try:
        # Создаем временный файл
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{audio_format}") as tmp_file:
            tmp_file.write(audio_bytes)
            tmp_file_path = tmp_file.name
        
        try:
            # Загружаем через parselmouth
            sound = parselmouth.Sound(tmp_file_path)
            return sound
        except Exception as e:
            # Логируем ошибку для отладки
            print(f"Error loading audio: {str(e)}")
            print(f"Audio bytes size: {len(audio_bytes)}")
            print(f"Audio format: {audio_format}")
            # Сохраняем файл для отладки (опционально)
            # with open(f"/tmp/debug_audio_{int(time.time())}.{audio_format}", "wb") as f:
            #     f.write(audio_bytes)
            raise HTTPException(status_code=400, detail=f"Failed to load audio: {str(e)}")
        finally:
            # Удаляем временный файл
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process audio: {str(e)}")


@app.post("/analyze-phoneme", response_model=PhonemeAnalysisResponse)
async def analyze_phoneme(request: PhonemeAnalysisRequest):
    """
    Анализирует фонему в аудио и извлекает форманты используя Praat
    
    Args:
        request: Запрос с base64 аудио и параметрами
    
    Returns:
        Результат анализа с формантами
    """
    print(f"Received request: phoneme={request.phoneme}, audio_format={request.audio_format}, audio_data_length={len(request.audio_data)}")
    try:
        # Декодируем аудио
        audio_bytes = decode_audio_from_base64(request.audio_data, request.audio_format)
        
        print(f"Received audio: size={len(audio_bytes)} bytes, format={request.audio_format}, phoneme={request.phoneme}")
        
        # Загружаем в Parselmouth
        try:
            sound = load_audio_from_bytes(audio_bytes, request.audio_format)
            print(f"Loaded sound: duration={sound.duration}s, sample_rate={sound.sampling_frequency}Hz")
        except Exception as e:
            print(f"Error loading sound: {str(e)}")
            return PhonemeAnalysisResponse(
                success=False,
                formants=FormantAnalysis(),
                sample_rate=0,
                duration=0.0,
                message=f"Failed to load audio: {str(e)}"
            )
        
        # Определяем временную точку для анализа
        if request.start_time is not None and request.end_time is not None:
            # Анализируем указанный сегмент
            start = max(0.0, request.start_time)
            end = min(sound.duration, request.end_time)
            if start >= end:
                raise HTTPException(status_code=400, detail="Invalid time range: start >= end")
            
            # Извлекаем сегмент
            segment = sound.extract_part(from_time=start, to_time=end, preserve_times=False)
            time_point = segment.duration / 2.0
            sound_to_analyze = segment
        else:
            # Анализируем весь файл в середине
            time_point = sound.duration / 2.0
            sound_to_analyze = sound
        
        # Определяем max_formant в зависимости от типа фонемы
        # Для согласных нужен более широкий диапазон
        is_consonant = request.phoneme and request.phoneme.lower() in "бвгджзйклмнпрстфхцчшщ"
        max_formant = 5500.0 if is_consonant else 5000.0
        
        # Извлекаем форманты
        formants = extract_formants_praat(
            sound_to_analyze,
            time_point=time_point,
            max_formant=max_formant
        )
        
        return PhonemeAnalysisResponse(
            success=True,
            formants=formants,
            sample_rate=int(sound.sampling_frequency),
            duration=float(sound.duration),
            message=f"Analyzed phoneme '{request.phoneme}' using Praat LPC analysis"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        return PhonemeAnalysisResponse(
            success=False,
            formants=FormantAnalysis(),
            sample_rate=0,
            duration=0.0,
            message=f"Error during analysis: {str(e)}"
        )


@app.post("/analyze-phoneme-file", response_model=PhonemeAnalysisResponse)
async def analyze_phoneme_file(
    file: UploadFile = File(...),
    phoneme: Optional[str] = None,
    start_time: Optional[float] = None,
    end_time: Optional[float] = None
):
    """
    Анализирует фонему из загруженного файла
    
    Args:
        file: Аудио файл
        phoneme: Название фонемы (опционально)
        start_time: Начало сегмента в секундах
        end_time: Конец сегмента в секундах
    
    Returns:
        Результат анализа с формантами
    """
    try:
        # Читаем файл
        audio_bytes = await file.read()
        
        # Определяем формат из расширения
        audio_format = file.filename.split('.')[-1].lower() if '.' in file.filename else "wav"
        
        # Создаем запрос
        request = PhonemeAnalysisRequest(
            audio_data=base64.b64encode(audio_bytes).decode('utf-8'),
            audio_format=audio_format,
            phoneme=phoneme,
            start_time=start_time,
            end_time=end_time
        )
        
        return await analyze_phoneme(request)
    
    except Exception as e:
        return PhonemeAnalysisResponse(
            success=False,
            formants=FormantAnalysis(),
            sample_rate=0,
            duration=0.0,
            message=f"Error processing file: {str(e)}"
        )


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "phonetics-analysis"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8041)

