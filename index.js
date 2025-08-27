const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000
app.use(cors());

app.get('/', (req, res) => {
    res.send('Students are focusin on their studies');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});