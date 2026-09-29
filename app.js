'use strict';
/* RingSale POS Demo — standalone PWA. State persists to on-device localStorage; survives reloads & force-closes. */

const $=s=>document.querySelector(s);
const R=n=>Math.round(n*100)/100;
const M=n=>'$'+R(n).toFixed(2);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------------- menu data ---------------- */
const TACO_ADDONS=[
 {name:'Extra Cheese',price:1.00},
 {name:'Guacamole',price:1.50},
 {name:'Sour Cream',price:0.75},
 {name:'Jalapeños',price:0.50},
 {name:'Extra Meat',price:2.00}
];
const DRINK_SIZES={label:'Size',choices:[{name:'Regular',delta:0},{name:'Large',delta:1.00}]};
const FRESCA_FLAVORS={label:'Flavor',choices:[{name:'Horchata',delta:0},{name:'Jamaica',delta:0},{name:'Tamarindo',delta:0}]};

let STORE_KEY='fiveanddime-demo-v1';
let curVendor=null;              // the logged-in vendor (see VENDORS below)
const SAMPLE_MENU=[
 {id:'birria',name:'Birria Taco',cat:'Tacos',price:3.50,stock:60,avail:true,addons:TACO_ADDONS},
 {id:'alpastor',name:'Al Pastor Taco',cat:'Tacos',price:3.00,stock:60,avail:true,addons:TACO_ADDONS},
 {id:'carnitas',name:'Carnitas Taco',cat:'Tacos',price:3.25,stock:60,avail:true,addons:TACO_ADDONS},
 {id:'fish',name:'Baja Fish Taco',cat:'Tacos',price:4.00,stock:40,avail:true,addons:TACO_ADDONS},
 {id:'pack6',name:'Taco Pack (6)',cat:'Taco Packs',price:18.00,stock:12,avail:true,tacoCount:6,addons:TACO_ADDONS},
 {id:'pack12',name:'Taco Pack (12)',cat:'Taco Packs',price:34.00,stock:8,avail:true,tacoCount:12,addons:TACO_ADDONS},
 {id:'jarritos',name:'Mango Jarritos',cat:'Drinks',price:2.50,stock:48,avail:true,opt:DRINK_SIZES},
 {id:'coke',name:'Mexican Coke',cat:'Drinks',price:2.50,stock:36,avail:true},
 {id:'fresca',name:'Agua Fresca',cat:'Drinks',price:3.00,stock:24,avail:true,opt:FRESCA_FLAVORS},
 {id:'elote',name:'Elote (Street Corn)',cat:'Sides',price:4.50,stock:30,avail:true,addons:[{name:'Extra Cotija',price:0.75},{name:'Extra Crema',price:0.50},{name:'Extra Lime',price:0.00}]},
 {id:'chips',name:'Chips & Guac',cat:'Sides',price:5.00,stock:20,avail:true},
 {id:'churros',name:'Churros (3 pc)',cat:'Sides',price:4.00,stock:25,avail:true}
];
/* ---------------- vendors ---------------- */
const BURGER_ADDONS=[
 {name:'Extra Patty',price:2.50},
 {name:'Bacon',price:1.75},
 {name:'Extra Cheese',price:1.00},
 {name:'Caramelized Onions',price:0.75},
 {name:'Avocado',price:1.50}
];
const FRIES_ADDONS=[
 {name:'Cheese Sauce',price:1.00},
 {name:'Bacon Bits',price:1.25},
 {name:'Extra Seasoning',price:0.00}
];
const SHAKE_SIZES={label:'Size',choices:[{name:'Regular',delta:0},{name:'Large',delta:1.25}]};
const BURGER_MENU=[
 {id:'smash',name:'Classic Smash Burger',cat:'Burgers',price:8.50,stock:40,avail:true,addons:BURGER_ADDONS},
 {id:'double',name:'Double Smash Burger',cat:'Burgers',price:11.50,stock:30,avail:true,addons:BURGER_ADDONS},
 {id:'baconjam',name:'Bacon Jam Smash',cat:'Burgers',price:10.75,stock:25,avail:true,addons:BURGER_ADDONS},
 {id:'shroom',name:'Mushroom Swiss Burger',cat:'Burgers',price:9.75,stock:20,avail:true,addons:BURGER_ADDONS},
 {id:'chicken',name:'Crispy Chicken Sandwich',cat:'Burgers',price:8.75,stock:25,avail:true},
 {id:'combo',name:'Smash Combo',cat:'Combos',price:13.50,stock:20,avail:true,packCount:1,addons:FRIES_ADDONS},
 {id:'dblcombo',name:'Double Combo',cat:'Combos',price:16.50,stock:12,avail:true,packCount:2,addons:FRIES_ADDONS},
 {id:'fries',name:'Regular Fries',cat:'Sides',price:3.50,stock:50,avail:true},
 {id:'loadedfries',name:'Loaded Fries',cat:'Sides',price:5.50,stock:30,avail:true,addons:FRIES_ADDONS},
 {id:'vshake',name:'Vanilla Shake',cat:'Shakes',price:5.00,stock:20,avail:true,opt:SHAKE_SIZES},
 {id:'cshake',name:'Chocolate Shake',cat:'Shakes',price:5.00,stock:20,avail:true,opt:SHAKE_SIZES},
 {id:'soda',name:'Fountain Drink',cat:'Drinks',price:2.50,stock:40,avail:true,opt:DRINK_SIZES}
];
/* Vendor 1 keeps the original store key so existing on-device demo data is preserved. */
const VENDORS=[
 {id:'taco',name:"Marta's Tacos",tag:'Taco truck · demo register',
  color:'#0f766e',colorDark:'#115e59',colorDarker:'#134e4a',
  storeKey:'fiveanddime-demo-v1',sampleMenu:SAMPLE_MENU,defLoc:'Main Stall',
  countKey:'tacoCount',countCat:'Tacos',countNoun:'tacos',countCard:'Tacos sold'},
 {id:'burger',name:'The Burger Shack',tag:'Smash burgers & fries · demo register',
  color:'#c2410c',colorDark:'#9a3412',colorDarker:'#7c2d12',
  storeKey:'fiveanddime-demo-burger-v1',sampleMenu:BURGER_MENU,defLoc:'Truck',
  countKey:'packCount',countCat:'Burgers',countNoun:'burgers',countCard:'Burgers sold'}
];
function deepCopy(o){return JSON.parse(JSON.stringify(o));}
let MENU=deepCopy(SAMPLE_MENU);
function vendorCats(){
  const cs=[];
  MENU.forEach(function(i){if(cs.indexOf(i.cat)<0)cs.push(i.cat);});
  return ['All'].concat(cs);
}

/* ---------------- state ---------------- */
let ticket=[];            // {key,itemId,name,cat,qty,unit,size,addons:[{name,price,onSide}],tacoCount}
let discountPct=0;
let sales=[];             // today's sales
let closedDays=[];        // {loc,at,sales}
let saleSeq=1;
let activeCat='All';
let eightysix=false;          // 86 mode: tapping a menu item 86s / un-86s it instead of selling
let ticketNote='';             // free-text note on the current ticket
let viewingClosed=-1;     // index into closedDays, -1 = live day
let cust=null;            // customization session {item,qty,sizeIdx,addons:[{on,onSide}]}
let cashTender={total:0,tendered:0};
let cashPad='';               // keypad entry buffer for the cash tender screen

/* ---------------- on-device persistence ---------------- */
let lastSavedAt=null;
function snapshotState(){
  return {v:1,vendor:curVendor?curVendor.id:null,menu:MENU,sales:sales,closedDays:closedDays,ticket:ticket,
    discountPct:discountPct,ticketNote:ticketNote,saleSeq:saleSeq,savedAt:new Date().toISOString()};
}
function reviveDates(){
  sales.forEach(function(s){s.at=new Date(s.at);});
  closedDays.forEach(function(cd){cd.at=new Date(cd.at);(cd.sales||[]).forEach(function(s){s.at=new Date(s.at);});});
}
function validState(p){
  return p&&p.v===1&&Array.isArray(p.menu)&&p.menu.length>0&&
    Array.isArray(p.sales)&&Array.isArray(p.closedDays)&&typeof p.saleSeq==='number';
}
function applyState(p){
  MENU=p.menu;sales=p.sales;closedDays=p.closedDays;
  ticket=Array.isArray(p.ticket)?p.ticket:[];
  discountPct=typeof p.discountPct==='number'?p.discountPct:0;
  ticketNote=typeof p.ticketNote==='string'?p.ticketNote:'';
  saleSeq=p.saleSeq;lastSavedAt=p.savedAt?new Date(p.savedAt):null;
  reviveDates();
}
function resetToDefaults(){
  MENU=deepCopy(curVendor.sampleMenu);sales=[];closedDays=[];saleSeq=1;
  ticket=[];discountPct=0;viewingClosed=-1;activeCat='All';lastSavedAt=null;
  saveState(); /* persist the clean snapshot so the device always holds valid data */
}
function saveState(){
  try{
    localStorage.setItem(STORE_KEY,JSON.stringify(snapshotState()));
    lastSavedAt=new Date();updateSaveIndicator();
  }catch(e){/* storage unavailable — app keeps working in-memory */}
}
function loadState(){
  try{
    const raw=localStorage.getItem(STORE_KEY);
    if(!raw){resetToDefaults();return;}
    const p=JSON.parse(raw);
    if(!validState(p)){resetToDefaults();return;}
    applyState(p);
  }catch(e){resetToDefaults();}
}
function updateSaveIndicator(){
  const el=$('#save-ind');
  if(el)el.title=lastSavedAt?
    ('All data saved on this device · '+lastSavedAt.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})):
    'All data is saved on this device';
}

/* ---------------- modal helpers ---------------- */
function openModal(html){$('#modal-box').innerHTML=html;$('#modal').hidden=false;}
function closeModal(){$('#modal').hidden=true;$('#modal-box').innerHTML='';}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('#modal').hidden)closeModal();});
$('#modal').addEventListener('click',function(e){if(e.target.id==='modal')closeModal();});

/* ---------------- login / tabs ---------------- */
function setBrand(v){
  const st=document.documentElement.style;
  st.setProperty('--brand',v.color);
  st.setProperty('--brand-dark',v.colorDark);
  st.setProperty('--brand-darker',v.colorDarker);
  const mt=document.querySelector('meta[name=theme-color]');
  if(mt)mt.content=v.colorDarker;
}
function resetSession(){
  ticket=[];discountPct=0;sales=[];closedDays=[];saleSeq=1;
  activeCat='All';viewingClosed=-1;cust=null;
  cashTender={total:0,tendered:0};cashPad='';lastSavedAt=null;
}
function renderVendorPicker(){
  $('#vendor-list').innerHTML=VENDORS.map(function(v){
    return '<button class="vendor-card" style="--vc:'+v.color+'" onclick="loginAs(\''+v.id+'\')">'+
    '<span class="vc-bar"></span>'+
    '<span class="vc-info"><span class="vc-name">'+esc(v.name)+'</span>'+
    '<span class="vc-tag">'+esc(v.tag)+'</span></span>'+
    '<span class="vc-go">›</span></button>';
  }).join('');
}
function loginAs(vid){
  const v=VENDORS.find(function(x){return x.id===vid;});
  if(!v)return;
  curVendor=v;STORE_KEY=v.storeKey;
  setBrand(v);
  resetSession();
  loadState();
  $('#hdr-vendor').textContent=v.name;
  $('#screen-login').hidden=true;
  $('#screen-app').hidden=false;
  const d=new Date();
  $('#hdr-day').textContent=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  showTab('sell');
  renderAll();renderMenuAdmin();renderReports();updateSaveIndicator();
}
function logout(){
  if(curVendor)saveState();
  closeModal();resetSession();curVendor=null;
  $('#screen-app').hidden=true;
  $('#screen-login').hidden=false;
}
function showTab(name){
  document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('active',t.dataset.tab===name);});
  ['sell','menu','reports'].forEach(function(n){$('#tab-'+n).hidden=(n!==name);});
  if(name==='menu')renderMenuAdmin();
  if(name==='reports')renderReports();
}
function renderAll(){renderCats();renderMenu();renderTicket();}

/* ---------------- sell: menu grid ---------------- */
function renderCats(){
  $('#cat-chips').innerHTML=vendorCats().map(function(c){
    return '<button class="chip'+(c===activeCat?' active':'')+'" onclick="setCat(\''+c+'\')">'+esc(c)+'</button>';
  }).join('')+'<button class="chip chip86'+(eightysix?' active':'')+'" onclick="toggle86()">86'+(eightysix?' ON':'')+'</button>';
}
function setCat(c){activeCat=c;renderCats();renderMenu();}
function toggle86(){eightysix=!eightysix;renderCats();renderMenu();}
function menuTap(id){
  if(eightysix){
    const it=MENU.find(function(i){return i.id===id;});
    if(it){it.avail=!it.avail;saveState();renderMenu();}
    return;
  }
  openCustomize(id);
}
function renderMenu(){
  const items=MENU.filter(function(i){return activeCat==='All'||i.cat===activeCat;});
  const grid=$('#menu-grid');
  grid.classList.toggle('mode86',eightysix);
  grid.innerHTML=items.map(function(i){
    return '<button class="menu-item'+(i.avail?'':' out')+'" onclick="menuTap(\''+i.id+'\')">'+
    '<span class="nm">'+esc(i.name)+'</span>'+
    '<span class="pr">'+M(i.price)+'</span>'+
    '<span class="st">'+(eightysix?(i.avail?'Tap to 86':'86\u2019d — tap to restore'):(i.avail?('In stock: '+i.stock):'86\u2019d'))+'</span>'+
    '</button>';
  }).join('')||'<p class="ticket-empty">No items in this category.</p>';
}

/* ---------------- item customization ---------------- */
function openCustomize(id){
  const item=MENU.find(function(i){return i.id===id;});
  if(!item||!item.avail)return;
  cust={item:item,qty:1,sizeIdx:0,addons:(item.addons||[]).map(function(){return{on:false,onSide:false};})};
  renderCustomize();
}
function custUnit(){
  const it=cust.item;
  let u=it.price;
  if(it.opt)u+=it.opt.choices[cust.sizeIdx].delta;
  cust.addons.forEach(function(a,i){if(a.on)u+=it.addons[i].price;});
  return R(u);
}
function renderCustomize(){
  const it=cust.item,u=custUnit();
  let optHtml='';
  if(it.opt){
    optHtml='<div class="opt-group"><div class="glbl">'+esc(it.opt.label)+'</div>'+
      it.opt.choices.map(function(c,i){
        return '<label class="opt"><input type="radio" name="custopt"'+(i===cust.sizeIdx?' checked':'')+
        ' onchange="custSize('+i+')"><span>'+esc(c.name)+'</span><span style="margin-left:auto;color:#78716c">'+(c.delta?'+'+M(c.delta):'Included')+'</span></label>';
      }).join('')+'</div>';
  }
  let addonHtml='';
  if(it.addons&&it.addons.length){
    addonHtml='<div class="opt-group"><div class="glbl">Add-ons</div>'+
      it.addons.map(function(a,i){
        const st=cust.addons[i];
        return '<div class="addon-row"><input type="checkbox"'+(st.on?' checked':'')+' onchange="custAddon('+i+')">'+
        '<span class="an">'+esc(a.name)+'</span><span class="ap">+'+M(a.price)+'</span>'+
        '<label class="onside"><input type="checkbox"'+(st.onSide?' checked':'')+' onchange="custOnSide('+i+')">On side</label></div>';
      }).join('')+'</div>';
  }
  const det=[];
  if(it.opt)det.push(esc(it.opt.choices[cust.sizeIdx].name));
  (it.addons||[]).forEach(function(a,i){
    if(cust.addons[i].on)det.push(esc(a.name)+(cust.addons[i].onSide?' (on the side)':''));
  });
  openModal(
    '<h2>'+esc(it.name)+'</h2><div class="sub">'+M(it.price)+' base · In stock: '+it.stock+'</div>'+
    optHtml+addonHtml+
    '<div class="preview"><div class="pv-name">'+esc(it.name)+'</div>'+
    '<div class="pv-det">'+(det.join(' · ')||'Classic — no extras')+'</div>'+
    '<div class="pv-price">'+M(u)+' each</div></div>'+
    '<div class="qty" style="margin-bottom:12px"><button onclick="custQty(-1)">−</button><strong>Qty: '+cust.qty+'</strong><button onclick="custQty(1)">+</button></div>'+
    '<div class="modal-actions"><button class="btn" onclick="closeModal()">Cancel</button>'+
    '<button class="btn primary" onclick="addToTicket()">Add · '+M(R(u*cust.qty))+'</button></div>'
  );
}
function custSize(i){cust.sizeIdx=i;renderCustomize();}
function custQty(d){const it=cust.item;cust.qty=Math.min(Math.max(1,cust.qty+d),Math.max(1,it.stock));renderCustomize();}
function custAddon(i){cust.addons[i].on=!cust.addons[i].on;if(!cust.addons[i].on)cust.addons[i].onSide=false;renderCustomize();}
function custOnSide(i){const st=cust.addons[i];if(!st.on){st.on=true;st.onSide=true;}else{st.onSide=!st.onSide;}renderCustomize();}
function addToTicket(){
  const it=cust.item,u=custUnit();
  const addons=(it.addons||[]).filter(function(a,i){return cust.addons[i].on;}).map(function(a,i){
    const idx=it.addons.indexOf(a);
    return{name:a.name,price:a.price,onSide:cust.addons[idx].onSide};
  });
  const line={
    key:'L'+Date.now()+Math.floor(Math.random()*999),
    itemId:it.id,name:it.name,cat:it.cat,qty:cust.qty,unit:u,
    size:it.opt?it.opt.choices[cust.sizeIdx].name:null,
    addons:addons
  };
  line[curVendor.countKey]=it[curVendor.countKey]||0;
  ticket.push(line);
  cust=null;closeModal();saveState();renderTicket();
}

/* ---------------- ticket ---------------- */
function ticketSubtotal(){return R(ticket.reduce(function(s,l){return s+R(l.unit*l.qty);},0));}
function ticketTotal(){return R(ticketSubtotal()*(1-discountPct/100));}
function renderTicket(){
  const box=$('#ticket-lines');
  if(!ticket.length){
    box.innerHTML='<p class="ticket-empty">Ticket is empty — tap a menu item to start.</p>';
  }else{
    box.innerHTML=ticket.map(function(l){
      const det=[];
      if(l.size)det.push(esc(l.size));
      l.addons.forEach(function(a){det.push(esc(a.name)+(a.onSide?' (side)':''));});
      return '<div class="tline"><div class="top"><span>'+esc(l.name)+'</span><span>'+M(R(l.unit*l.qty))+'</span></div>'+
      (det.length?'<div class="det">'+det.join(' · ')+'</div>':'')+
      '<div class="row"><div class="qty"><button onclick="lineQty(\''+l.key+'\',-1)">−</button><strong>'+l.qty+'</strong><button onclick="lineQty(\''+l.key+'\',1)">+</button></div>'+
      '<button class="linklike" onclick="lineRemove(\''+l.key+'\')">Remove</button></div></div>';
    }).join('');
  }
  const sub=ticketSubtotal(),tot=ticketTotal(),disc=R(sub-tot);
  $('#discount-row').innerHTML='<span class="lbl">Discount</span>'+
    [0,5,10,15].map(function(p){
      return '<button class="disc-btn'+(discountPct===p?' active':'')+'" onclick="setDiscount('+p+')">'+p+'%</button>';
    }).join('');
  $('#note-row').innerHTML=ticket.length?
    (ticketNote
      ? '<div class="tnote"><span>'+esc(ticketNote)+'</span><button class="linklike" onclick="editNote()">Edit</button></div>'
      : '<button class="btn note-btn" onclick="editNote()">+ Note</button>')
    :'';
  $('#ticket-totals').innerHTML=
    '<div class="r"><span>Subtotal</span><span>'+M(sub)+'</span></div>'+
    (disc>0?'<div class="r"><span>Discount ('+discountPct+'%)</span><span>−'+M(disc)+'</span></div>':'')+
    '<div class="r grand"><span>Total</span><span>'+M(tot)+'</span></div>';
  document.querySelectorAll('#tender-row .tender').forEach(function(b){b.disabled=!ticket.length;});
}
function lineQty(key,d){
  const l=ticket.find(function(x){return x.key===key;});if(!l)return;
  l.qty+=d;
  if(l.qty<=0)ticket=ticket.filter(function(x){return x.key!==key;});
  saveState();renderTicket();
}
function lineRemove(key){ticket=ticket.filter(function(x){return x.key!==key;});saveState();renderTicket();}
function setDiscount(p){discountPct=p;saveState();renderTicket();}
function editNote(){
  openModal('<h2>Ticket note</h2><div class="sub">Shows on the ticket and saves with the sale. Good for allergies, "no onions", etc.</div>'+
   '<textarea id="note-text" rows="3" style="width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit" placeholder="Type note\u2026">'+esc(ticketNote)+'</textarea>'+
   '<div class="modal-actions"><button class="btn" onclick="closeModal()">Cancel</button>'+
   (ticketNote?'<button class="btn" onclick="clearNote()">Clear</button>':'')+
   '<button class="btn primary" onclick="saveNote()">Save note</button></div>');
}
function saveNote(){const t=$('#note-text');ticketNote=t?t.value.trim():'';saveState();closeModal();renderTicket();}
function clearNote(){ticketNote='';saveState();closeModal();renderTicket();}

/* ---------------- tender ---------------- */
function openTender(type){
  if(!ticket.length)return;
  if(type==='cash'){cashTender={total:ticketTotal(),tendered:0};cashPad='';renderCash();return;}
  const label={zelle:'Zelle',venmo:'Venmo',card:'Other card'}[type]||type;
  openModal('<h2>'+label+' payment</h2><div class="sub">Confirm this '+label+' payment to complete the sale.</div>'+
    '<div class="cash-due"><div class="amt">'+M(ticketTotal())+'</div><div class="sub">amount due</div></div>'+
    '<div class="modal-actions"><button class="btn" onclick="closeModal()">Back</button>'+
    '<button class="btn primary" onclick="completeSale(\''+label+'\','+ticketTotal()+',0)">Confirm '+label+' payment</button></div>');
}
function renderCash(){
  const due=cashTender.total,td=cashTender.tendered;
  const change=R(td-due);
  const bills=[5,10,20,50,100].map(function(b){
    return '<button class="btn bill"'+(b<due?' disabled':'')+' onclick="cashBill('+b+')">$'+b+'</button>';
  }).join('');
  const up=Math.ceil(due-1e-9);
  openModal('<h2>Cash payment</h2><div class="sub">Tap the bills the customer hands you.</div>'+
   '<div class="cash-due"><div class="amt">'+M(due)+'</div><div class="sub">amount due</div></div>'+
   '<div class="cash-tendered"><span>Tendered: '+M(td)+'</span></div>'+
   (change>=0?'<div class="change-big"><div class="cb-label">Change due</div><div class="cb-amt">'+M(change)+'</div></div>'
             :'<div class="change-big due"><div class="cb-label">Still due</div><div class="cb-amt">'+M(-change)+'</div></div>')+
   '<div class="bill-grid">'+bills+
   '<button class="btn bill roundup" onclick="cashRoundUp()">Round up · '+M(up)+'</button></div>'+
   '<div style="display:flex;gap:8px;margin-bottom:8px"><button class="btn" style="flex:1" onclick="cashExact()">Exact '+M(due)+'</button>'+
   '<button class="btn" style="flex:1" onclick="cashClear()">Clear</button></div>'+
   '<div class="pad-display">'+M(cashPadVal())+'</div>'+
   '<div class="pad-grid">'+
   ['1','2','3','4','5','6','7','8','9','.','0','bksp'].map(function(k){
     return '<button class="pad-key" onclick="cashPadKey(\''+k+'\')">'+(k==='bksp'?'⌫':k)+'</button>';
   }).join('')+
   '<button class="pad-key fn" onclick="cashPadKey(\'clear\')">C</button>'+
   '<button class="pad-key pad-add" onclick="cashPadAdd()">Add</button></div>'+
   '<div class="modal-actions"><button class="btn" onclick="closeModal()">Back</button>'+
   '<button class="btn primary"'+(td>=due?'':' disabled')+' onclick="completeSale(\'Cash\','+td+','+Math.max(0,change)+')">Complete sale</button></div>');
}
function cashBill(b){cashTender.tendered=R(cashTender.tendered+b);renderCash();}
function cashRoundUp(){cashTender.tendered=Math.ceil(cashTender.total-1e-9);renderCash();}
function cashExact(){cashTender.tendered=cashTender.total;renderCash();}
function cashClear(){cashTender.tendered=0;renderCash();}
function cashPadVal(){
  const v=parseFloat(cashPad);
  return isNaN(v)?0:R(v);
}
function cashPadKey(k){
  if(k==='clear'){cashPad='';}
  else if(k==='bksp'){cashPad=cashPad.slice(0,-1);}
  else if(k==='.'){
    if(!cashPad)cashPad='0.';
    else if(cashPad.indexOf('.')<0&&cashPad.length<7)cashPad+='.';
  }else{ /* digit */
    if(cashPad==='0')cashPad=k;
    else{
      const dot=cashPad.indexOf('.');
      if(cashPad.length<7&&!(dot>=0&&cashPad.length-dot>2))cashPad+=k;
    }
  }
  renderCash();
}
function cashPadAdd(){
  const v=cashPadVal();
  if(v>0)cashTender.tendered=R(cashTender.tendered+v);
  cashPad='';
  renderCash();
}

/* ---------------- complete sale / receipt ---------------- */
function completeSale(tender,tendered,change){
  const sub=ticketSubtotal(),tot=ticketTotal();
  const sale={
    id:'S'+String(saleSeq++).padStart(3,'0'),
    at:new Date(),loc:curVendor.defLoc,
    lines:ticket.map(function(l){
      const sl={itemId:l.itemId,cat:l.cat,name:l.name,qty:l.qty,unit:l.unit,total:R(l.unit*l.qty),
        size:l.size,addons:l.addons.map(function(a){return{name:a.name,price:a.price,onSide:a.onSide};})};
      sl[curVendor.countKey]=l[curVendor.countKey]||0;
      return sl;
    }),
    sub:sub,disc:R(sub-tot),total:tot,tender:tender,tendered:R(tendered),change:R(change),note:ticketNote
  };
  sale.lines.forEach(function(sl){
    const m=MENU.find(function(i){return i.id===sl.itemId;});
    if(m)m.stock=Math.max(0,m.stock-sl.qty);
  });
  sales.push(sale);
  ticket=[];discountPct=0;ticketNote='';
  saveState();renderTicket();
  const rows=sale.lines.map(function(l){
    return '<div class="r" style="display:flex;justify-content:space-between"><span>'+l.qty+' × '+esc(l.name)+'</span><span>'+M(l.total)+'</span></div>';
  }).join('');
  openModal('<h2>Sale complete</h2><div class="sub">'+sale.id+' · '+esc(tender)+'</div>'+
   (tender==='Cash'&&change>0?'<div class="change-big"><div class="cb-label">Change due</div><div class="cb-amt">'+M(change)+'</div></div>':'')+
   (sale.note?'<div class="tnote" style="margin-bottom:10px"><span>'+esc(sale.note)+'</span></div>':'')+
   '<div class="receipt">'+rows+
   '<div style="margin-top:6px;border-top:1px solid #e7e5e4;padding-top:6px;display:flex;justify-content:space-between;font-weight:800"><span>Total</span><span>'+M(tot)+'</span></div></div>'+
   '<div class="modal-actions"><button class="btn primary" onclick="closeModal();showTab(\'reports\')">View reports</button>'+
   '<button class="btn" onclick="closeModal()">New sale</button></div>');
}

/* ---------------- menu admin ---------------- */
function renderMenuAdmin(){
  $('#menu-admin-list').innerHTML=MENU.map(function(i){
    return '<div class="admin-row"><div class="ai"><div class="an">'+esc(i.name)+'</div>'+
    '<div class="ad">'+esc(i.cat)+' · '+M(i.price)+' · Stock '+i.stock+'</div></div>'+
    '<label class="switch"><input type="checkbox"'+(i.avail?' checked':'')+' onchange="toggleAvail(\''+i.id+'\')"><span class="tr"></span></label>'+
    '<button class="btn" onclick="openMenuEdit(\''+i.id+'\')">Edit</button></div>';
  }).join('');
}
function toggleAvail(id){
  const i=MENU.find(function(x){return x.id===id;});
  if(i){i.avail=!i.avail;saveState();renderMenuAdmin();renderMenu();}
}
/* ---- menu editor: options & add-on row builders ---- */
function meOptRowHtml(name,delta){
  return '<div class="ed-row me-opt-row">'+
  '<input class="cname grow" placeholder="Choice name (e.g. Large)" value="'+esc(name||'')+'">'+
  '<input class="cdelta narrow" inputmode="decimal" placeholder="+$0.00" value="'+(delta==null?'':Number(delta).toFixed(2))+'">'+
  '<button class="rm" onclick="this.closest(\'.me-opt-row\').remove()" aria-label="Remove choice">×</button></div>';
}
function meAddOptRow(name,delta){
  $('#me-opt-rows').insertAdjacentHTML('beforeend',meOptRowHtml(name,delta));
}
function meClearOpt(){$('#me-opt-rows').innerHTML='';}
function meAddRowHtml(name,price){
  return '<div class="ed-row me-add-row">'+
  '<input class="aname grow" placeholder="Add-on name (e.g. Extra Cheese)" value="'+esc(name||'')+'">'+
  '<input class="aprice narrow" inputmode="decimal" placeholder="$0.00" value="'+(price==null?'':Number(price).toFixed(2))+'">'+
  '<button class="rm" onclick="this.closest(\'.me-add-row\').remove()" aria-label="Remove add-on">×</button></div>';
}
function meAddAddRow(name,price){
  $('#me-add-rows').insertAdjacentHTML('beforeend',meAddRowHtml(name,price));
}
function openMenuEdit(id){
  const i=id?MENU.find(function(x){return x.id===id;}):null;
  const cats=vendorCats().slice(1).map(function(c){
    return '<option'+(i&&i.cat===c?' selected':'')+'>'+esc(c)+'</option>';
  }).join('');
  openModal('<h2>'+(i?'Edit item':'Add item')+'</h2><div class="sub">Changes apply to this demo session.</div>'+
   '<div class="form-row"><label>Name</label><input id="me-name" value="'+esc(i?i.name:'')+'"></div>'+
   '<div class="form-row"><label>Category</label><select id="me-cat">'+cats+'</select></div>'+
   '<div class="form-row"><label>Price</label><input id="me-price" inputmode="decimal" value="'+(i?i.price.toFixed(2):'')+'" placeholder="0.00"></div>'+
   '<div class="form-row"><label>Stock</label><input id="me-stock" inputmode="numeric" value="'+(i?i.stock:'')+'" placeholder="0"></div>'+
   '<div class="ed-sec"><h4>Options (sizes / variants)</h4>'+
   '<div class="form-row"><label>Group label</label><input id="me-opt-label" value="'+esc(i&&i.opt?i.opt.label:'Size')+'"></div>'+
   '<div id="me-opt-rows">'+((i&&i.opt?i.opt.choices:[]).map(function(c){return meOptRowHtml(c.name,c.delta);}).join(''))+'</div>'+
   '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="meAddOptRow()">+ Add choice</button>'+
   ((i&&i.opt)?'<button class="btn warn" style="flex:1" onclick="meClearOpt()">Remove options</button>':'')+'</div></div>'+
   '<div class="ed-sec"><h4>Add-ons</h4>'+
   '<div id="me-add-rows">'+((i&&i.addons?i.addons:[]).map(function(a){return meAddRowHtml(a.name,a.price);}).join(''))+'</div>'+
   '<button class="btn" style="width:100%" onclick="meAddAddRow()">+ Add add-on</button></div>'+
   '<div class="modal-actions"><button class="btn" onclick="closeModal()">Cancel</button>'+
   (i?'<button class="btn warn" onclick="deleteMenuItem(\''+i.id+'\')">Delete</button>':'')+
   '<button class="btn primary" onclick="saveMenuItem('+(i?'\''+i.id+'\'':'null')+')">Save</button></div>');
}
function saveMenuItem(id){
  const name=$('#me-name').value.trim(),cat=$('#me-cat').value;
  const price=parseFloat(String($('#me-price').value||'').replace(/[^0-9.]/g,''));
  const stock=parseInt(String($('#me-stock').value||'').replace(/[^0-9]/g,''),10);
  if(!name||isNaN(price)||isNaN(stock))return;
  const optLabel=String($('#me-opt-label').value||'').trim()||'Size';
  const choices=[];
  document.querySelectorAll('.me-opt-row').forEach(function(r){
    const nm=String(r.querySelector('.cname').value||'').trim();
    const dl=parseFloat(String(r.querySelector('.cdelta').value||'').replace(/[^0-9.]/g,''));
    if(nm)choices.push({name:nm,delta:isNaN(dl)?0:Math.max(0,R(dl))});
  });
  const addons=[];
  document.querySelectorAll('.me-add-row').forEach(function(r){
    const nm=String(r.querySelector('.aname').value||'').trim();
    const pr=parseFloat(String(r.querySelector('.aprice').value||'').replace(/[^0-9.]/g,''));
    if(nm&&!isNaN(pr))addons.push({name:nm,price:Math.max(0,R(pr))});
  });
  if(id){
    const it=MENU.find(function(x){return x.id===id;});
    if(it){
      it.name=name;it.cat=cat;it.price=R(price);it.stock=stock;
      if(choices.length)it.opt={label:optLabel,choices:choices};else delete it.opt;
      if(addons.length)it.addons=addons;else delete it.addons;
    }
  }else{
    const ni={id:'custom'+Date.now(),name:name,cat:cat,price:R(price),stock:stock,avail:true};
    if(choices.length)ni.opt={label:optLabel,choices:choices};
    if(addons.length)ni.addons=addons;
    MENU.push(ni);
  }
  closeModal();saveState();renderMenuAdmin();renderMenu();
}
function deleteMenuItem(id){
  MENU=MENU.filter(function(x){return x.id!==id;});
  ticket=ticket.filter(function(l){return l.itemId!==id;});
  closeModal();saveState();renderMenuAdmin();renderMenu();renderTicket();
}

/* ---------------- reports ---------------- */
function summarize(list){
  const v=curVendor,ck=v?v.countKey:'tacoCount';
  const s={gross:0,orders:list.length,qty:0,units:0,items:{},addons:{},tenders:{}};
  list.forEach(function(sa){
    s.gross=R(s.gross+sa.total);
    s.tenders[sa.tender]=R((s.tenders[sa.tender]||0)+sa.total);
    sa.lines.forEach(function(l){
      s.qty+=l.qty;
      const pk=l[ck]||l.tacoCount||0;
      const e=s.items[l.itemId]||(s.items[l.itemId]={name:l.name,qty:0,revenue:0,units:0,pack:!!pk});
      e.qty+=l.qty;e.revenue=R(e.revenue+l.total);
      const n=(v&&l.cat===v.countCat)?l.qty:pk*l.qty;
      e.units+=n;s.units+=n;
      l.addons.forEach(function(a){
        const ak=a.name+(a.onSide?' (side)':'');
        const ae=s.addons[ak]||(s.addons[ak]={qty:0,revenue:0});
        ae.qty+=l.qty;ae.revenue=R(ae.revenue+a.price*l.qty);
      });
    });
  });
  s.gross=R(s.gross);
  return s;
}
function card(v,l){return '<div class="card"><div class="cv">'+v+'</div><div class="cl">'+l+'</div></div>';}
function repTable(head,rows){
  return '<table class="rep"><thead><tr>'+head.map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr></thead><tbody>'+
   rows.map(function(r){return '<tr>'+r.map(function(c,i){return '<td class="'+(i>0?'num':'')+'">'+c+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';
}
function reportSales(){return viewingClosed>=0?closedDays[viewingClosed].sales:sales;}
function renderReports(){
  const list=reportSales(),s=summarize(list),live=viewingClosed<0;
  let html='';
  if(!live){
    const cd=closedDays[viewingClosed];
    html+='<div class="closed-banner"><strong>Viewing closed day — '+esc(cd.loc)+'</strong><button class="btn" onclick="backToLive()">Back to today</button></div>';
  }
  html+='<div class="cards">'+card(M(s.gross),'Gross sales')+card(String(s.orders),'Orders')+
    card(s.orders?M(R(s.gross/s.orders)):'$0.00','Avg ticket')+
    card(String(s.qty),'Items sold')+card(String(s.units),esc(curVendor.countCard))+'</div>';
  const items=Object.keys(s.items).map(function(k){return s.items[k];}).sort(function(a,b){return b.revenue-a.revenue;});
  html+='<div class="rep-sec"><h3>Item sales</h3>'+(items.length?repTable(
    ['Item','Qty','Revenue'],
    items.map(function(e){
      const t=e.pack&&e.units?(' <span class="zero">('+e.units+' '+esc(curVendor.countNoun)+')</span>'):'';
      return [esc(e.name)+t,String(e.qty),M(e.revenue)];
    })
  ):'<p class="zero">No sales yet.</p>')+'</div>';
  const ads=Object.keys(s.addons).map(function(k){return{name:k,qty:s.addons[k].qty,revenue:s.addons[k].revenue};})
    .sort(function(a,b){return b.revenue-a.revenue;});
  if(ads.length)html+='<div class="rep-sec"><h3>Add-on sales</h3>'+repTable(['Add-on','Qty','Revenue'],
    ads.map(function(a){return [esc(a.name),String(a.qty),M(a.revenue)];}))+'</div>';
  const tm=Object.keys(s.tenders);
  if(tm.length)html+='<div class="rep-sec"><h3>Tender mix</h3>'+repTable(['Tender','Total'],
    tm.map(function(k){return [esc(k),M(s.tenders[k])];}))+'</div>';
  html+='<div class="rep-sec"><h3>Stock remaining</h3>'+repTable(['Item','Left'],
    MENU.map(function(i){return [esc(i.name)+(i.avail?'':' <span class="zero">(off)</span>'),String(i.stock)];}))+'</div>';
  const soldIds={};Object.keys(s.items).forEach(function(k){soldIds[k]=1;});
  const zero=MENU.filter(function(i){return !soldIds[i.id];});
  html+='<div class="rep-sec"><h3>Not selling yet</h3>'+(zero.length?'<p>'+zero.map(function(i){return esc(i.name);}).join(', ')+'</p>':'<p class="zero">Everything has sold at least once.</p>')+'</div>';
  html+='<div class="rep-sec"><h3>Recent orders</h3>'+(list.length?repTable(['Order','Items','Tender','Total'],
    list.slice().reverse().slice(0,20).map(function(sa){
      return [sa.id,String(sa.lines.reduce(function(n,l){return n+l.qty;},0)),esc(sa.tender),M(sa.total)];
    })):'<p class="zero">No orders yet.</p>')+'</div>';
  if(live)html+='<div class="rep-sec"><h3>End of day</h3><p class="sub" style="margin-bottom:10px">Close and save the day when you finish or move locations.</p><button class="btn primary big" onclick="openCloseDay()">Close &amp; Save Day</button></div>';
  if(closedDays.length){
    html+='<div class="rep-sec"><h3>Closed days</h3>'+repTable(['Location','Closed','Orders','Total',''],
      closedDays.map(function(cd,i){
        const cs=summarize(cd.sales);
        return [esc(cd.loc),cd.at.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}),String(cs.orders),M(cs.gross),'<button class="btn" onclick="viewClosedDay('+i+')">View</button>'];
      }))+'</div>';
  }
  html+='<div class="rep-sec"><h3>Demo data</h3>'+
   '<p class="sub" style="margin-bottom:10px"><span class="save-ind inline"><span class="dot"></span>Saved on this device</span>'+
   (lastSavedAt?' · last saved '+lastSavedAt.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'')+'</p>'+
   '<button class="btn warn" onclick="openResetData()">Reset demo data</button></div>';
  $('#reports-body').innerHTML=html;
}
function openCloseDay(){
  const s=summarize(sales);
  openModal('<h2>Close &amp; save day</h2><div class="sub">'+s.orders+' orders · '+M(s.gross)+' gross. The live report resets; this day stays viewable.</div>'+
   '<div class="form-row"><label>Location</label><input id="cd-loc" value="'+esc(curVendor.defLoc)+'"></div>'+
   '<div class="modal-actions"><button class="btn" onclick="closeModal()">Cancel</button>'+
   '<button class="btn primary" onclick="confirmCloseDay()">Close day</button></div>');
}
function confirmCloseDay(){
  const defLoc=curVendor?curVendor.defLoc:'Main Stall';
  const loc=String($('#cd-loc').value||defLoc).trim()||defLoc;
  closedDays.unshift({loc:loc,at:new Date(),sales:sales});
  sales=[];ticket=[];discountPct=0;viewingClosed=-1;
  saveState();closeModal();renderTicket();renderReports();
}
function viewClosedDay(i){viewingClosed=i;renderReports();}
function backToLive(){viewingClosed=-1;renderReports();}
function openResetData(){
  openModal('<h2>Reset demo data</h2><div class="sub">Clears this vendor\'s saved sales, closed days, ticket and menu changes on this device, and restores the sample menu. Other vendors are untouched. Use this for a clean slate before each pitch.</div>'+
   '<div class="modal-actions"><button class="btn" onclick="closeModal()">Cancel</button>'+
   '<button class="btn warn" onclick="confirmResetData()">Reset everything</button></div>');
}
function confirmResetData(){
  try{localStorage.removeItem(STORE_KEY);}catch(e){}
  resetToDefaults();
  closeModal();renderAll();renderMenuAdmin();renderReports();updateSaveIndicator();
}

/* ---------------- startup ---------------- */
renderVendorPicker();
updateSaveIndicator();

/* ---------------- service worker ---------------- */
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});
}
