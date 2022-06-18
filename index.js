import fetch from "node-fetch";
import Nugu from "nugu-kit";
import express from "express";

const app = express();
app.use(express.json());


app.post('/answer.food',(req,res)=>{
    const nugu = new Nugu(req);

    nugu.output = {'state': 'wind', 'temperature' : 13};
    return res.json(nugu.response);
});

app.get('/weather',(req,res)=>{
    let weatherData = null;
    fetch("http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=Z22oQrPq3USZd7lE5uRdHuVNYSAGqT8rRNWQY556ts%2FxG9R7LLBpdyghdVmQXvUdejstovP%2BCgSKzg0MwD8a5w%3D%3D&pageNo=1&numOfRows=1000&dataType=JSON&base_date=20220618&base_time=0600&nx=55&ny=127")
    .then((response) => response.json())
    .then((data) => {
        //weatherData = ;
        console.log(data.response.body.items.item);
    });
})

app.get('/',(req, res)=>{
    console.log('Hello');
})

app.listen(3000,()=>{
    console.log('3000 Æ÷Æ®');
})