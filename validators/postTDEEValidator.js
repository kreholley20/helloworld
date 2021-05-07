"use strict";
const Joi = require('joi');

exports.postTDEESchema= Joi.object({
    weight: Joi.number().integer().min(0).required(),
    age: Joi.number().integer().min(0).required()
});