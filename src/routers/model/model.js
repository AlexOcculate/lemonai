const router = require("koa-router")();

const Model = require('@src/models/Model');
const Platform = require('@src/models/Platform');
const { Op } = require("sequelize");
// Create a new model
/**
 * @swagger
 * /api/model:
 *   post:
 *     summary: Create a new model
 *     tags:  
 *       - Model
 *     description: This endpoint creates a new model with the provided content.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform_id:
 *                 type: string
 *                 description: Platform ID
 *               model_id:
 *                 type: string
 *                 description: model id
 *               model_name:
 *                 type: string
 *                 description: model name
 *               group_name:
 *                 type: string
 *                 description: group name
 *               model_types:
 *                 type: array
 * 
 *     responses:
 *       200:
 *         description: Successfully created a new platform
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: './schemas/model.json'
 *                 code:
 *                   type: integer
 *                   description: Status code
 *                 msg:
 *                   type: string
 *                   description: Message
 *                 
 */
router.post("/", async ({ request, response }) => {
    const body = request.body || {};

    const { platform_id, model_id, model_name, group_name,model_types } = body

    const existingModel = await Model.findOne({ where: { model_id: model_id } });
    if (existingModel) {
        return response.error("Model ID already exists");
    }

    const model = await Model.create({
        platform_id: platform_id,
        model_id: model_id,
        model_name: model_name,
        group_name: group_name,
        model_types: model_types
    });

    return response.success(model);
});

// Get model list by platform id
/**
 * @swagger
 * /api/model/platform/{platform_id}:
 *   get:
 *     summary: Get model list by platform id
 *     tags:  
 *       - Model
 *     description: This endpoint retrieves a list of models by platform id.
 *     parameters:
 *       - in: path
 *         name: platform_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the platform
 *     responses:
 *       200:
 *         description: Successfully retrieved model list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: './schemas/model.json'
 *                 code:
 *                   type: integer
 *                   description: Status code
 *                 msg:
 *                   type: string
 *                   description: Message
 *                 
 */
router.get("/list/:platform_id", async ({ params, response }) => {
    const { platform_id } = params;

    const models = await Model.findAll({
        where: { platform_id: platform_id }
    });

    return response.success(models);
});

// update model
/**
 * @swagger
 * /api/model/{id}:
 *   put:
 *     summary: Update model
 *     tags:  
 *       - Model
 *     description: This endpoint updates a specified model.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the model to be updated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model_name:
 *                 type: string
 *                 description: Model name
 *               group_name:
 *                 type: string
 *                 description: Group name
 *               model_types:
 *                 type: array
 *
 *
 */

router.put("/:id", async ({ params, request, response }) => {
    const { id } = params;
    const body = request.body || {};

    const { model_name, group_name,model_types } = body

    const model = await Model.update(
        {
            model_name: model_name,
            group_name: group_name,
            model_types: model_types
        },
        {
            where: { id: id },
        }
    );

    return response.success(model);
});

// Delete model
/**
 * @swagger
 * /api/model/{id}:
 *   delete:
 *     summary: Delete model
 *     tags:  
 *       - Model
 *     description: This endpoint deletes a specified model.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the model to be deleted
 *     responses:
 *       200:
 *         description: Model deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: './schemas/model.json'
 *                 code:
 *                   type: integer
 *                   description: Status code
 *                 msg:
 *                   type: string
 *                   description: Message
 */
router.delete("/:id", async ({ params, response }) => {
    const { id } = params;

    await Model.destroy({
        where: { id: id },
    });

    return response.success("Model deleted successfully");
});

// get model list where platform is enabled
/**
 * @swagger
 * /api/model/enabled:
 *   get:
 *     summary: Get model list where platform is enabled
 *     tags:  
 *       - Model
 *     description: This endpoint retrieves a list of models where the platform is enabled.
 *     responses:
 *       200:
 *         description: Successfully retrieved model list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: './schemas/model_enable.json'
 *                 code:
 *                   type: integer
 *                   description: Status code
 *                 msg:
 *                   type: string
 *                   description: Message
 */
router.get("/enabled", async ({ response }) => {
    const platforms = await Platform.findAll({
        where: {
            is_enabled: true,
        },
    });
    let allModels = [];
    for(let platform of platforms){
        const models = await Model.findAll({
            where: {
                platform_id: platform.id,
            },
        });
        for(let model of models){
            allModels.push({
                ...model.dataValues,
                platform_name: platform.name,
            });
        }
    }
    return response.success(allModels);
});

module.exports = exports = router.routes();