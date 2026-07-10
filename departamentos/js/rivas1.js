<script>

const reveals = document.querySelectorAll(".reveal");

window.addEventListener("scroll",()=>{

reveals.forEach(reveal=>{

const windowHeight = window.innerHeight;
const revealTop = reveal.getBoundingClientRect().top;

if(revealTop < windowHeight - 100){
reveal.classList.add("active");
}

});

});

const topBtn = document.getElementById("topBtn");

window.onscroll = function(){

if(document.body.scrollTop > 300 || document.documentElement.scrollTop > 300){

topBtn.style.display = "block";

}else{

topBtn.style.display = "none";

}

};

topBtn.onclick = function(){

window.scrollTo({
top:0,
behavior:"smooth"
});

};

function darkMode(){

document.body.classList.toggle("dark-mode");

}

</script>
