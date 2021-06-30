const { BadRequest } = require('../utils/errors')

exports.updateName = async (req, res) => {
  try {
    const { name } = req.body

    if (!name) throw new BadRequest('Name is not provided')

    req.user.name = name

    await req.user.save()

    res.status(200).json({
      message: 'Successfully updated the name of the user'
    })
  } catch (e) {
    console.log(e)
    // send some html response!
    res.status(400).send()
  }
}
