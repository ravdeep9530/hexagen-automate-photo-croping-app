import pytest
from src.utils.wasm.index import wasmInvertImage, wasmGrayscaleImage

@pytest.mark.asyncio
async def test_wasm_invert_image():
    image = bytearray([0, 128, 255])
    result = await wasmInvertImage(image)
    assert list(result) == [255, 127, 0]

@pytest.mark.asyncio
async def test_wasm_grayscale_image():
    # RGBA pixels: [R,G,B,A, R,G,B,A]
    image = bytearray([10, 20, 30, 255, 100, 150, 200, 255])
    result = await wasmGrayscaleImage(image)
    # First pixel avg: (10+20+30)//3 = 20
    # Second pixel avg: (100+150+200)//3 = 150
    assert list(result) == [20, 20, 20, 255, 150, 150, 150, 255]
