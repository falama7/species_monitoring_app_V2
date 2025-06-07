from marshmallow import Schema, fields, validate, post_load
from datetime import datetime

class UserSchema(Schema):
    id = fields.Str(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=6))
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    role = fields.Str(validate=validate.OneOf(['admin', 'researcher', 'observer']))
    is_active = fields.Bool()
    created_at = fields.DateTime(dump_only=True)
    last_login = fields.DateTime(dump_only=True)

class LoginSchema(Schema):
    username = fields.Str(required=True)
    password = fields.Str(required=True)

class SpeciesSchema(Schema):
    id = fields.Str(dump_only=True)
    scientific_name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    common_name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    family = fields.Str(validate=validate.Length(max=50))
    genus = fields.Str(validate=validate.Length(max=50))
    species_code = fields.Str(validate=validate.Length(max=10))
    conservation_status = fields.Str(validate=validate.OneOf([
        'LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX'  # IUCN Red List categories
    ]))
    description = fields.Str()
    habitat = fields.Str(validate=validate.Length(max=200))
    image_url = fields.Url()
    created_at = fields.DateTime(dump_only=True)

class ProjectSchema(Schema):
    id = fields.Str(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str()
    location = fields.Str(validate=validate.Length(max=200))
    start_date = fields.Date()
    end_date = fields.Date()
    status = fields.Str(validate=validate.OneOf(['active', 'completed', 'paused', 'cancelled']))
    created_by = fields.Nested(UserSchema, dump_only=True)
    members_count = fields.Int(dump_only=True)
    observations_count = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class ObservationSchema(Schema):
    id = fields.Str(dump_only=True)
    project_id = fields.Str(required=True)
    species_id = fields.Str(required=True)
    species = fields.Nested(SpeciesSchema, dump_only=True)
    observer = fields.Nested(UserSchema, dump_only=True)
    observation_date = fields.DateTime(required=True)
    latitude = fields.Float(required=True, validate=validate.Range(min=-90, max=90))
    longitude = fields.Float(required=True, validate=validate.Range(min=-180, max=180))
    location_name = fields.Str(validate=validate.Length(max=200))
    count = fields.Int(validate=validate.Range(min=1), missing=1)
    behavior = fields.Str(validate=validate.Length(max=100))
    habitat_description = fields.Str()
    weather_conditions = fields.Str(validate=validate.Length(max=100))
    notes = fields.Str()
    image_urls = fields.List(fields.Url())
    audio_urls = fields.List(fields.Url())
    accuracy = fields.Float(validate=validate.Range(min=0))
    altitude = fields.Float()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class IndicatorSchema(Schema):
    id = fields.Str(dump_only=True)
    project_id = fields.Str(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str()
    metric_type = fields.Str(required=True, validate=validate.OneOf([
        'count', 'density', 'diversity', 'abundance', 'frequency'
    ]))
    value = fields.Float()
    unit = fields.Str(validate=validate.Length(max=20))
    calculation_date = fields.DateTime()
    created_at = fields.DateTime(dump_only=True)

class ResourceSchema(Schema):
    id = fields.Str(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str()
    resource_type = fields.Str(required=True, validate=validate.OneOf([
        'guide', 'template', 'manual', 'dataset', 'tool'
    ]))
    category = fields.Str(validate=validate.Length(max=50))
    file_url = fields.Url()
    external_url = fields.Url()
    is_public = fields.Bool(missing=True)
    created_by = fields.Nested(UserSchema, dump_only=True)
    created_at = fields.DateTime(dump_only=True)