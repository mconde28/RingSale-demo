function mkEl(){return{innerHTML:'',textContent:'',hidden:false,title:'',style:{setProperty(){}},classList:{toggle(){},add(){},remove(){}},addEventListener(){},appendChild(){},setAttribute(){},querySelector(){return mkEl();},querySelectorAll(){return[];}};}
const els={};
global.document={querySelector(s){return els[s]||(els[s]=mkEl());},querySelectorAll(){return[];},addEventListener(){},createElement(){return mkEl();},documentElement:mkEl()};
global.window={addEventListener(){}};
global.navigator={};
global.localStorage={_s:{},getItem(k){return this._s[k]||null;},setItem(k,v){this._s[k]=v;},removeItem(k){delete this._s[k];}};
const fs=require('fs');
const driver=`
;(function(){
loginAs('burger');
console.log('vendor chip:', document.querySelector('#hdr-vendor').textContent);
openCustomize('baconjam');
let modal=document.querySelector('#modal-box').innerHTML;
console.log('Hold section:', modal.includes('Hold (leave off)'), '| lists Tomato:', modal.includes('>Tomato<'));
custHold(2); custHold(1);
modal=document.querySelector('#modal-box').innerHTML;
console.log('NO Tomato:', modal.includes('NO Tomato'), '| NO Lettuce:', modal.includes('NO Lettuce'));
addToTicket();
const th=document.querySelector('#ticket-lines').innerHTML;
console.log('ticket No Lettuce:', th.includes('No Lettuce'), '| No Tomato:', th.includes('No Tomato'));
// backfill check: simulate a pre-v9 saved menu item with no ingredients field
const it=MENU.find(function(i){return i.id==='smash';}); delete it.ingredients;
backfillMenuFields();
console.log('backfill restored ingredients:', Array.isArray(it.ingredients)&&it.ingredients.includes('Tomato'));
// cash sale end-to-end
completeSale("Cash",20,R(20-ticketTotal()));
const s=sales[sales.length-1];
console.log('sale holds saved:', JSON.stringify(s.lines[0].holds), '| change:', s.change);
// drawer: set opening cash, verify figures, close the day, verify closed-day drawer card
renderReports();
document.querySelector('#drawer-open').value='100';
setDrawerOpening();
const df2=drawerFigures();
console.log('drawer opening set:', drawerOpening===100, '| expected 110.75:', df2.expected===110.75, '| drop===cashSales:', df2.drop===df2.cashSales);
openCloseDay();
document.querySelector('#cd-loc').value='Test Stall';
confirmCloseDay();
console.log('closed drawer saved:', JSON.stringify(closedDays[0].drawer), '| opening reset:', drawerOpening===0, '| sales cleared:', sales.length===0);
console.log('close lands on closed view:', viewingClosed===0);
viewClosedDay(0);
const repHtml=document.querySelector('#reports-body').innerHTML;
console.log('closed view shows drawer card:', repHtml.includes('Cash drawer')&&repHtml.includes('Dropped'));
})();
`;
eval(fs.readFileSync(__dirname+'/../app.js','utf8')+driver);
