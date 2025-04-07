type MarketItem = {
    "id": Number,
    "appId": Number,
    "seller": {
        "steamId64": String,
        "botId": Number|null,
        "delivery": {
            "speed": String,
            "medianTime": Number,
            "successRate": Number
        }
    },
    "asset": {
        "id": Number,
        "names": {
            "short": String,
            "full": String,
            "identifier": Number
        },
        "images": {
            "steam": String
        }
    },
    "stickers": Array<{
        "collection": {
            "name": String
        },
        "name": String,
        "image": String,
        "wiki": String,
        "wear": Number,
        "pricing": {
            "default": Number
        }
    }>|null,
    "pricing": {
        "default": Number,
        "priceBeforeDiscount": Number,
        "discount": Number,
        "computed": Number,
        "basePrice": Number
    }
};

export default MarketItem;