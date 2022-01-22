const data_to_send = null;
var small = null;
var big = null;
var curr = null;
var api_key_string="";

function fetch_intraday_pair(from,to,interval) {
const xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
	if (this.readyState === this.DONE) {
        curr = JSON.parse(this.response);
	}
});
//USD,JPY,5min
xhr.open("GET", "https://alpha-vantage.p.rapidapi.com/query?function=FX_INTRADAY&interval="+interval+"&to_symbol="+to+"&from_symbol="+from+"&datatype=json&outputsize=compact");
xhr.setRequestHeader("x-rapidapi-host", "alpha-vantage.p.rapidapi.com");
xhr.setRequestHeader("x-rapidapi-key", api_key_string);
xhr.send(data_to_send);
}

function display_on_html(response,add){
    if(add){
        document.getElementById("api_response").innerText+=response;
        return;
    }

    document.getElementById("api_response").innerText=response;
}

async function wait_til_not_null_curr(){
    if(curr === null){
        setTimeout(wait_til_not_null_curr,1000);
    }else{
        var key= Object.keys(curr)[Object.keys(curr).length - 1];
   var date=Object.keys(curr[key])[Object.keys(curr).length - 1];
   display_on_html("current: "+date,false);
    //getting the last key of the object
    return new Promise(function(resolve,err) {
        var data_= Object.values(Object.values(curr)[Object.keys(curr).length - 1])[0];
        var final_data= Object.values(data_)[Object.values(data_).length-1];
        resolve(final_data);
        err("error");
    }); 
    }
}


/*
 *
 * functions connected to SMAs
 * 
 */

function get_small_sma(symbol){
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            small = JSON.parse(this.response);
        }
    });

    xhr.open("GET", "https://alpha-vantage.p.rapidapi.com/query?time_period=7&interval=15min&series_type=close&function=SMA&symbol="+symbol+"&datatype=json");
    xhr.setRequestHeader("x-rapidapi-host", "alpha-vantage.p.rapidapi.com");
    xhr.setRequestHeader("x-rapidapi-key", api_key_string);
    xhr.send(data_to_send);
}

function get_big_sma(symbol){
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            big = JSON.parse(this.response);
        }
    });

    xhr.open("GET", "https://alpha-vantage.p.rapidapi.com/query?time_period=21&interval=15min&series_type=close&function=SMA&symbol="+symbol+"&datatype=json");
    xhr.setRequestHeader("x-rapidapi-host", "alpha-vantage.p.rapidapi.com");
    xhr.setRequestHeader("x-rapidapi-key", api_key_string);
    xhr.send(data_to_send);
}

async function get_sma_results(symbol){
    get_small_sma(symbol);
    get_big_sma(symbol);
    let promise =new Promise(function(resolve) {
            setTimeout(async function(){
                    let smallv=await wait_til_not_null_small();
                    let bigv=await wait_til_not_null_big();
                    resolve([smallv,bigv]);
            },2000);
    });
return await promise;
}

async function wait_til_not_null_small(){
    if(small === null){
        setTimeout(wait_til_not_null_small,1000);
    }else{
    console.log(Object.keys(small["Technical Analysis: SMA"])[Object.keys(small).length - 1]);
    //getting the last key of the object
    return new Promise(function(resolve,err) {
        resolve((small["Technical Analysis: SMA"][Object.keys(small["Technical Analysis: SMA"])[Object.keys(small).length - 1]]["SMA"]));
        err("error");
    }); 
    }
}

async function wait_til_not_null_big(){
    if(big === null){
        setTimeout(wait_til_not_null_big,1000);
    }else{
    //getting the last key of the object
    return new Promise(function(resolve,err) {
        resolve((big["Technical Analysis: SMA"][Object.keys(big["Technical Analysis: SMA"])[Object.keys(big).length - 1]]["SMA"]));
        err("error");
    });
    }
}

function sell_or_buy_order(arr){
    display_on_html("\nsmall:"+arr[0]+"    ,big:"+arr[1],true);
    if(arr[0]>arr[1]){
        console.log("small sma >big sma");
        display_on_html("\nsmall sma >big sma",true);
        //if small > big then buy
    }else if (arr[1]>arr[0]){
        console.log("big sma >small sma");
        display_on_html("\nbig sma >small sma",true);
            //if big > small then sell
    }
}

function start_the_bot(){
    if ((document.getElementById("api_key").value).endsWith("here")){
        display_on_html("please write your apikey",false);
        return;
    }
    api_key_string=document.getElementById("api_key").value;
    window.localStorage.setItem("apikey",api_key_string);


    fetch_intraday_pair("USD","JPY","15min");

    let current =new Promise(function(resolve) { 
        setTimeout(async() => {
            let current_ = await wait_til_not_null_curr();
         resolve(current_);
        }, 1000);
    });
    current.then(function(data){
        display_on_html("\ncurrent value: "+data,true);
    });
    
    
   let get_array_of_sma =new Promise(function(resolve) { 
       setTimeout(async() => {
        let array_of_SMAs=await get_sma_results("USDJPY");
        resolve(array_of_SMAs);
       }, 1000);
   });
   get_array_of_sma.then(function(arr){
       sell_or_buy_order(arr);
   });
}

function check_if_key_exists(){
    if (window.localStorage.getItem("apikey")){
        document.getElementById("api_key").value = window.localStorage.getItem("apikey");
    }
}

async function init() {
    check_if_key_exists();
    document.getElementById("start_button").onclick = start_the_bot;
 }
 
 window.onload = init;