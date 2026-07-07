
function scrollSection(){

document.querySelector('#actividades').scrollIntoView({
behavior:'smooth'
});

}

function updateClock(){

const now = new Date();

let h = String(now.getHours()).padStart(2,'0');
let m = String(now.getMinutes()).padStart(2,'0');
let s = String(now.getSeconds()).padStart(2,'0');

document.getElementById('clock').innerHTML =
`${h}:${m}:${s}`;

}

setInterval(updateClock,1000);

function toggleDarkMode(){
document.body.classList.toggle('dark');
}

let images = document.querySelectorAll('.gallery img');

images.forEach((img,index)=>{

setInterval(()=>{

img.style.transform='scale(1.05)';

setTimeout(()=>{
img.style.transform='scale(1)';
},1500);

},3000 + (index*1000));

});

</script>


!function(d,s,id){
var js,fjs=d.getElementsByTagName(s)[0];
if(!d.getElementById(id)){
js=d.createElement(s);
js.id=id;
js.src='https://weatherwidget.io/js/widget.min.js';
fjs.parentNode.insertBefore(js,fjs);
}
}(document,'script','weatherwidget-io-js');
</script>
