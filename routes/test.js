const express = require('express');

const router = express.Router()

router.get('/status', (req, res, next) => {
    console.log('TEST ROUTE')
    res.status(200).json({
        status: 'success',
        message: {
            '1.)':  'Improved the auth route and made some changes to the user model',
            '2.)':  'Added keep alive functionality',
            '3.)':  'Increased KAT'
        }
    })
})

module.exports = router
