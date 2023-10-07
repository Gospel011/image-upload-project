const express = require('express');

const router = express.Router()

router.get('/status', (req, res, next) => {
    console.log('TEST ROUTE')
    res.status(200).json({
        status: 'success',
        message: 'Gospel is a divine monarch and Emmanuel Ndema is his imperial servant'
    })
})

module.exports = router