const prisma = require('../config/db')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/AppError')
const sendResponse = require('../utils/sendResponse')
const sharp = require('sharp')
const path = require('path')

exports.addProduct = catchAsync(async (req, res, next) => {
    const { title, description, price, stock, offerPrice, availability, category } = req.body
    if(!title || !description || !price || !stock || !offerPrice || !availability || !category){
        return next(new AppError("title, description, price, stock, offerPrice, availability and category are required",400))
    }
    const parsedAvailability = availability
        ? availability.split(',').map(item => Number(item.trim()))
        : [];

    const userId = req.payload
    const parsedPrice = parseFloat(price)
    const parsedOfferPrice = parseFloat(offerPrice)

    if (!req.file || !req.file.buffer) {
        return next(new AppError(`no files`, 400));
    }
    const filename = `image-${Date.now()}-${req.file.originalname}`
    const outputPath = path.join(__dirname, '../uploads', filename);

    await sharp(req.file.buffer)
        .resize({ width: 800 })
        .jpeg({
            quality: 60,        // 50–70 is ideal for mobile
            chromaSubsampling: '4:4:4', // better text/image clarity (especially for UI screenshots)
            progressive: true   // improves loading experience on slow connections
        })
        .toFile(outputPath);

    const newProduct = await prisma.products.create({
        data: { title, description, price: parsedPrice, offerPrice: parsedOfferPrice, availability: parsedAvailability, stock: Number(stock), category, userId, image: filename }
    })
    sendResponse(res, 201, true, "Product added", newProduct)
})

exports.getAllProducts = catchAsync(async (req, res, next) => {
    const { search, category, price, limit, cursor } = req.query;
    const parsedLimit = parseInt(limit) || 15;


    let condition = {};
    if (search && search !== "") {
        condition.title = { contains: search, mode: "insensitive" };
    }
    if (category && category.trim() !== "") {
        condition.category = { contains: category, mode: "insensitive" };
    }
    if (price && price.trim() !== "") {
        const parsedPrice = parseFloat(price);
        condition.price = { lte: parsedPrice };
    }

    const products = await prisma.products.findMany({
        where: condition,
        take: parsedLimit + 1,
        ...(cursor && {
            skip: 1,
            cursor: { id: cursor }
        }),
        orderBy: { id: 'asc' }
    });
    const hasNextPage = products.length > parsedLimit;
    const data = products.slice(0, parsedLimit);
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

    return sendResponse(res, 200, true, '', {
        products: data,
        pagination: {
            nextCursor,
            hasNextPage
        }
    });
})

exports.getUserPosts = catchAsync(async (req, res, next) => {
    const userId = req.payload
    const products = await prisma.products.findMany({
        where: { userId }
    })
    if (!products) {
        return next(new AppError(`product not found `, 404))
    }
    sendResponse(res, 200, true, '', products)
})

exports.updateUserProducts = catchAsync(async (req, res, next) => {
    const { id } = req.params
    var { title, description, price, availability, category, image } = req.body;
    console.log(availability);
    const parsedAvailability = availability
    ? availability.split(',').map(item => Number(item.trim()))
    : [];
    if (req.file) {
        image = `image-${Date.now()}-${req.file.originalname}`
        const outputPath = path.join(__dirname, '../uploads', image);

        await sharp(req.file.buffer)
            .resize({ width: 800 })
            .jpeg({
                quality: 60,
                chromaSubsampling: '4:4:4',
                progressive: true
            })
            .toFile(outputPath);
    }
    const updatedProduct = await prisma.products.update({
        where: { id },
        data: { title, description, price:Number(price), availability:parsedAvailability, category, image }
    })
    sendResponse(res, 200, true, 'product updated successfully', updatedProduct)
})

exports.getUniqueProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const product = await prisma.products.findUnique({
        where: { id }
    })
    let totalRating = 0;
    var averageRating = 0;
    if (product.reviews && product.reviews.length > 0) {
        product.reviews.map((item) => {
            totalRating += item.rating
        })
        averageRating = totalRating / product.reviews.length
    }

    const vendor = await prisma.vendor.findUnique({
        where: { userId: product.userId }
    })
    sendResponse(res, 200, true, '', { product, shopname: vendor.shopname, rating: averageRating })
})

exports.deleteProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const product = await prisma.products.delete({
        where: { id }
    })
    sendResponse(res, 200, true, 'product deleted', product)
})

exports.addProductReview = catchAsync(async (req, res, next) => {
    const userId = req.payload
    const { id } = req.params
    const { review, rating } = req.body
    const product = await prisma.products.findUnique({
        where: { id }
    })
    if (!product) { return next(new AppError(`product not found`, 404)) }
    const newReview = { review, rating, userId };
    // Check if the product already has reviews
    let updatedReviews = Array.isArray(product.reviews) ? product.reviews : [];

    updatedReviews.push(newReview);
    await prisma.products.update({
        where: { id },
        data: { reviews: updatedReviews }
    });
    sendResponse(res, 201, true, 'Review added successfully',)
})
