const express = require("express");
const mysql     = require('mysql');
const Nugu = require("nugu-kit");
const request = require("request");
const dotenv = require("dotenv");
const moment = require("moment");
const app 	= express();

dotenv.config()

var db = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_NAME
  });
  
db.connect();

app.set('port', process.env.PORT || 3000);

app.use(express.json());

app.get('/',(req, res)=>{
    res.sendFile('public/index.html' , { root : __dirname});
})

app.get('/video',(req, res)=>{
    res.sendFile('public/videoPage.html' , { root : __dirname});
})

app.get('health',(req, res)=>{
    console.log('OK');
})

app.post('/answer.weather',(req,res)=>{
    var now = moment();
    now.subtract(1, 'hour')
    var date = now.format("YYYYMMDD");
    var time = now.format("HH00");

    var apiurl = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${process.env.API_KEY}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${date}&base_time=${time}&nx=55&ny=127`;
    request(apiurl, function(eror, response, bodyparse){
        var data = JSON.parse(bodyparse);
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
    db.query('SELECT * FROM humidity_tb order by humidity_date desc limit 1', function(error, rows){
        if(error) console.log(error);

        var now = new Date();
        var status;
        var value = rows[0].humidity_value;
        if (value < 20) {
            status = "?????? ??????";
        } else if (value < 40) {
            status = "??????";
        } else if(value<70){
            status = "";
        }else if (value < 80) {
            status = "?????????";
        } else {
            status = "?????????";
        }
        nugu.output = {'month': now.getMonth()+1 , 'day' : now.getDate(), 'humidity' : value, 'status' : status};
        return res.json(nugu.response);
    });
})

app.get('/nodemcu/:humidity',function(req,res){
    var humidity = req.params.humidity;
    db.query(`insert into humidity_tb (humidity_value, humidity_date) values (${humidity}, now())`, function(error, rows){
        if(error) console.log(error);
    });
})

app.listen(3000,()=>{
    console.log('Listen port : 3000');
})