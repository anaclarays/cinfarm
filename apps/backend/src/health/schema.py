from marshmallow import Schema, fields

class HealthSchema(Schema):
    status = fields.String(metadata={"example": "OK"})