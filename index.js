const express = require("express")
const { Client } = require("@elastic/elasticsearch")
const { faker } = require('@faker-js/faker')

const app = express()
app.use(express.json())

const PORT = 8000

const genres = [
    'Fantasy',
    'Science',
    'Mystery',
    'Historical',
    'Romance',
    'Horror',
    'Biography',
    'Adventure'
]

const getRandomGenre = () => {
    const randomIndex = Math.floor(Math.random() * genres.length)
    return genres[randomIndex]
}

// Instantiate Elasticsearch client
const client = new Client({ node: 'http://localhost:9200' })


app.get('/init', async (req, res) => {
    // จำนวนที่จะ gen
    for (let i = 0; i < 10000; i++) {
        let book = {
            title: faker.commerce.productName(),
            author: faker.person.fullName(),
            genre: getRandomGenre()
        }
        console.log('position ', i, 'title', book.title)
        await client.index({
            index: 'old_books',
            body: book
        })
    }
    res.send({ success: true, message: "Books indexed!" })
})

// search in index
app.get('/search', async (req, res) => {
    const { q, index } = req.query
    if (!q || !index) {
        return res.send({ success: false, message: "Please provide a search query or index" })
    }
    try {
        const result = await client.search({
            index: index,
            body: {
                query: {
                    multi_match: {
                        query: q,
                        fields: ['title', 'author', 'genre']
                    }
                }
            }
        })
        res.json({ success: true, message: result.body.hits.hits })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
})

app.post('/insert', async (req, res) => {
    const { title, author, genre } = req.body
    const { index } = req.query
    if (!index) {
        return res.send({ success: false, message: "Please provide a index" })
    }
    if (!title || !author || !genre) {
        return res.send({ success: false, message: "Please provide all fields" })
    }
    try {
        const result = await client.index({
            index: index,
            body: {
                title,
                author,
                genre
            }
        })
        res.json({ success: true, message: result.body })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
})

app.listen(PORT, () => {
    console.log(`Express server started on http://localhost:${PORT}`)
})