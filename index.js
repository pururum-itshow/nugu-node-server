import fetch from "node-fetch";
import Nugu from "nugu-kit";
import express from "express";
import mysql from "mysql";
import dotenv from "dotenv"
import dateFormat, { masks } from "dateformat";
dotenv.config()

const connection = mysql.createConnection({
    host : process.env.DB_HOST,
    port : process.env.DB_PORT,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE
  });

connection.connect();

const app = express();
app.use(express.json());

app.get('/',(req, res)=>{
    console.log('index 접근');
})

app.get('health',(req, res)=>{
    console.log('OK');
})

app.post('/answer.weather',(req,res)=>{
    var now = new Date();
    var date = dateFormat(now, "yyyymmdd");
    var time = dateFormat(now, "HH00");
    //환경변수
    fetch(`http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${process.env.API_KEY}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${date}&base_time=${time}&nx=55&ny=127`)
    .then((response) => response.json())
    .then((data) => {
        var item = data.response.body.items.item;
        var state, temperature;

        item.forEach(value => {
            var category = value.category;
            if(category==="PTY"){
                switch (parseInt(value.obsrValue)) {
                    case 1:
                    case 5:
                    case 6:
                        state = "rain";
                        break;
                    case 2:
                    case 3:
                    case 4:
                    case 7:
                        state = "snow";
                        break;
                }
            }else if(category==="WDS"){
                var windSpeed = parseFloat(value.obsrValue);
                if(windSpeed > 14){
                    state = "wind";
                }
            }else if(category==="REH"){
                var reh = parseInt(value.obsrValue);
                if(reh <= 40){
                    state = "dry";
                }
            }else if(category === "T1H"){
                temperature = parseFloat(value.obsrValue);
                if(temperature >= 33){
                    state = "hot";
                }else if(temperature<=0){
                    state = "cold";
                }
            }
        });

        if(state===undefined){
            state = "";
        }

        const nugu = new Nugu(req);
        nugu.output = {'state': state , 'temperature' : temperature};
        return res.json(nugu.response);
    });
})


app.post('/answer.humidity',function(req,res){
    const nugu = new Nugu(req);
    connection.query('SELECT * FROM humidity_tb order by humidity_date desc limit 1', function(error, rows){
        if(error) console.log(error);

        var now = new Date();
        var status;
        var value = rows[0].humidity_value;
        if (value < 20) {
            status = "매우 마름";
        } else if (value < 40) {
            status = "마름";
        } else if(value<70){
            status = "";
        }else if (value < 80) {
            status = "촉촉함";
        } else {
            status = "축축함";
        }
        nugu.output = {'month': now.getMonth()+1 , 'day' : now.getDate(), 'humidity' : value, 'status' : status};
        return res.json(nugu.response);
    });
    connection.end();
})

app.listen(3000,()=>{
    console.log('Listen port : 3000');
})