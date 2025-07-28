const axios = require('axios')

exports.sendLineNotify = async (to, message) => {
    await axios.post('https://api.line.me/v2/bot/message/push', {
        to,
        messages: [message]
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        }
    })
}
