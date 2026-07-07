

function scrollSection(){

document.querySelector('#experiencias').scrollIntoView({
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

const music = document.getElementById("music");

function toggleMusic(){

if(music.paused){
music.play();
}else{
music.pause();
}

}

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
