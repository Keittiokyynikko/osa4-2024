const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const config = require('../utils/config')

blogsRouter.get('/', async (request, response, next) => {
    try {
        const blogs = await Blog.find({})
        .populate('user', {username:1, name:1, id:1})
        response.json(blogs)
    } catch(exception) {
        next(exception)
    }
})

blogsRouter.post('/', async (request, response, next) => {
    const body = request.body
    const decodedToken = jwt.verify(request.token, config.SECRET)
    if(!request.token || !decodedToken.id) {
        return response.status(401).json({error: 'token invalid'})
    }

    const user = request.user

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes !== undefined ? body.likes : 0,
        user: user._id
    })


    if(body.title === undefined || body.url === undefined) {
        return response.status(400).next({error: 'title and url are needed'})
    } else {
        try {
            const newBlog = await blog.save()
            user.blogs = user.blogs.concat(newBlog._id)
            await user.save()
            return response.status(201).json(newBlog)
        } catch(error) {
            next(error)
        }
    }
})

blogsRouter.delete('/:id', async (request, response, next) => {

    const user = await User.findById(request.id)

    const blog = await Blog.findById(request.params.id)
    if(blog.user.toString() === user._id.toString()) {
        try {
            await Blog.findByIdAndDelete(request.params.id)
            response.status(204).end()
        } catch(exception) {
            next(exception)
        }
    } else {
        return response.status(401).json({error: 'user not authorized to delete the blog'})
    }
})

blogsRouter.put('/:id', async (request, response, next) => {
    const body = request.body
    const blog = {
        likes: body.likes
    }
    try {
        const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {new: true})
        response.json(updatedBlog)
    } catch(exception) {
        next(exception)
    }
})

module.exports = blogsRouter