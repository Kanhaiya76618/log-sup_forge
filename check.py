import asyncio
import json
import ssl

import certifi
import websockets


async def test():
    ssl_context = ssl.create_default_context(cafile=certifi.where())

    async with websockets.connect(
        "wss://stream.aisstream.io/v0/stream",
        ssl=ssl_context
    ) as ws:
        await ws.send(json.dumps({
            "APIKey": "f77dfe77f42ffb4f50cc9d10138f1def69972bc9",
            "BoundingBoxes": [[[-90, -180], [90, 180]]]
        }))
        response = await ws.recv()
        print(response)


asyncio.run(test())
