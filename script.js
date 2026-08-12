const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS_R5ioLmNCJ0xXZPatoTr_gd2Ae2-kmxR0-lsoRTMvurdYgMh2WVQfaPS0xDFfj6DcMQi0761L42Z8/pub?gid=809976480&single=true&output=csv";

const countryCodes = {
  usa:"US","united states":"US","united states of america":"US",chile:"CL",
  sweden:"SE",switzerland:"CH",italy:"IT",italia:"IT",germany:"DE",canada:"CA",
  france:"FR",ukraine:"UA",england:"GB","united kingdom":"GB",australia:"AU",
  spain:"ES",mexico:"MX",brazil:"BR",argentina:"AR",colombia:"CO",peru:"PE",japan:"JP"
};

function parseCSV(text) {
  const rows=[]; let row=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){
    const char=text[i];
    if(char==='"'){
      if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;
    }else if(char===","&&!quoted){row.push(field);field="";}
    else if((char==="\n"||char==="\r")&&!quoted){
      if(char==="\r"&&text[i+1]==="\n")i++;
      row.push(field);if(row.some(Boolean))rows.push(row);row=[];field="";
    }else field+=char;
  }
  row.push(field);if(row.some(Boolean))rows.push(row);
  return rows;
}

function countryFlag(country){
  const code=countryCodes[country.trim().toLowerCase()];
  return code?[...code].map(char=>String.fromCodePoint(127397+char.charCodeAt(0))).join(""):"🌎";
}

function initials(name){
  return name.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join("").toUpperCase();
}

function escapeHTML(value){
  const el=document.createElement("div");el.textContent=value;return el.innerHTML;
}

function render(reviews){
  const grid=document.querySelector("#reviews");
  const average=reviews.reduce((sum,item)=>sum+item.rating,0)/reviews.length;
  document.querySelector("#average").textContent=average.toFixed(1);
  document.querySelector("#review-count").textContent=`Based on ${reviews.length} reviews`;

  grid.innerHTML=reviews.map(item=>{
    const name=escapeHTML(item.name),country=escapeHTML(item.country),review=escapeHTML(item.review);
    const avatar=item.photo
      ? `<img class="avatar" src="${escapeHTML(item.photo)}" alt="${name}">`
      : `<div class="avatar initials" aria-hidden="true">${initials(item.name)}</div>`;
    return `<article class="review-card">
      ${avatar}
      <div>
        <div class="student-line">
          <div><h2>${name}</h2><p>${item.age?`${escapeHTML(item.age)} years old · `:""}${countryFlag(item.country)} ${country}</p></div>
          <b class="quote" aria-hidden="true">“</b>
        </div>
        <div class="stars small-stars" aria-label="${item.rating} out of 5 stars">${"★".repeat(item.rating)}${"☆".repeat(5-item.rating)}</div>
        <blockquote>${review}</blockquote>
      </div>
    </article>`;
  }).join("");
}

async function loadReviews(){
  const grid=document.querySelector("#reviews");
  try{
    const response=await fetch(`${CSV_URL}&t=${Date.now()}`,{cache:"no-store"});
    if(!response.ok)throw new Error("Could not load reviews");
    const rows=parseCSV(await response.text());
    const headers=rows.shift().map(header=>header.trim().toLowerCase());
    const value=(row,column)=>(row[headers.indexOf(column)]||"").trim();
    const reviews=rows
      .filter(row=>["true","yes","1"].includes(value(row,"approved").toLowerCase()))
      .map(row=>({
        name:value(row,"name"),age:value(row,"age"),country:value(row,"country"),
        review:value(row,"review"),rating:Math.max(1,Math.min(5,Number(value(row,"rating"))||5)),
        photo:value(row,"photo")
      })).filter(item=>item.name&&item.review);
    if(!reviews.length)throw new Error("No approved reviews");
    render(reviews);
  }catch(error){
    document.querySelector("#average").textContent="—";
    document.querySelector("#review-count").textContent="Reviews unavailable";
    grid.innerHTML='<div class="error">The reviews could not be loaded.<br><button type="button" onclick="loadReviews()">Try again</button></div>';
  }
}

loadReviews();
