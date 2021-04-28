"use strict";
const Joi = require('joi');

exports.postMealSchema= Joi.object({
    mealname: Joi.string().required(),
    maincalorie: Joi.number().integer().required(),
    fats: Joi.number().integer().optional().allow(""),
    carbs: Joi.number().integer().optional().allow(""),
    proteins: Joi.number().integer().optional().allow(""),
});