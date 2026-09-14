/** PNMT · cálculo local do Sol. Equações de Meeus / NOAA, sem API remota.
 * https://gml.noaa.gov/grad/solcalc/calcdetails.html
 * Azimute: graus horários a partir do norte geográfico. Altura: centro do Sol.
 */
export const SOLAR_SITE=Object.freeze({
 latitude:-15.453,longitude:-56.087,timeZone:'America/Cuiaba',
 northClockwiseFromMinusZDegrees:-0.0422731455,
 locationSource:'Centro cartográfico do parque; orientação conferida por seis rotatórias da implantação e OpenStreetMap.',
 orientationAccuracy:'Aproximação cartográfica; não levantamento topográfico.'
});
export const PERIODS=Object.freeze(['manha','tarde','por-do-sol','noite']);
const rad=Math.PI/180,deg=180/Math.PI,mod=(n,m)=>(n%m+m)%m,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:SOLAR_SITE.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function localParts(date){return Object.fromEntries(formatter.formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));}
export function localDate(date=new Date()){const p=localParts(date);return `${p.year}-${p.month}-${p.day}`;}
export function validDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
 const d=new Date(value+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value&&+value.slice(0,4)>=2000&&+value.slice(0,4)<=2100;
}
export function localInstant(day,hour=12,minute=0){
 if(!validDate(day)||!Number.isFinite(hour)||!Number.isFinite(minute))throw Error('Data solar inválida.');
 const [y,m,d]=day.split('-').map(Number),desired=Date.UTC(y,m-1,d,hour,minute);let guess=desired+4*3600000;
 // Consulta o fuso IANA do navegador, inclusive para datas históricas com horário de verão.
 for(let i=0;i<3;i++){const p=localParts(new Date(guess));const actual=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);guess+=desired-actual;}
 return new Date(guess);
}
export function solarPosition(date,site=SOLAR_SITE){
 if(!Number.isFinite(+date)||!Number.isFinite(site.latitude)||Math.abs(site.latitude)>90||!Number.isFinite(site.longitude)||Math.abs(site.longitude)>180)throw Error('Posição solar inválida.');
 const jd=+date/86400000+2440587.5,t=(jd-2451545)/36525;
 const L=mod(280.46646+t*(36000.76983+.0003032*t),360),M=357.52911+t*(35999.05029-.0001537*t),e=.016708634-t*(.000042037+.0000001267*t);
 const C=Math.sin(M*rad)*(1.914602-t*(.004817+.000014*t))+Math.sin(2*M*rad)*(.019993-.000101*t)+Math.sin(3*M*rad)*.000289;
 const omega=125.04-1934.136*t,lambda=L+C-.00569-.00478*Math.sin(omega*rad);
 const obliq=23+(26+(21.448-t*(46.815+t*(.00059-t*.001813)))/60)/60+.00256*Math.cos(omega*rad);
 const dec=Math.asin(Math.sin(obliq*rad)*Math.sin(lambda*rad)),y=Math.tan(obliq*rad/2)**2;
 const equationMinutes=4*deg*(y*Math.sin(2*L*rad)-2*e*Math.sin(M*rad)+4*e*y*Math.sin(M*rad)*Math.cos(2*L*rad)-.5*y*y*Math.sin(4*L*rad)-1.25*e*e*Math.sin(2*M*rad));
 const utc=date.getUTCHours()*60+date.getUTCMinutes()+date.getUTCSeconds()/60+date.getUTCMilliseconds()/60000;
 const hourAngle=(mod(utc+equationMinutes+4*site.longitude,1440)/4-180)*rad,lat=site.latitude*rad;
 const elevation=deg*Math.asin(clamp(Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(hourAngle),-1,1));
 const azimuth=mod(deg*Math.atan2(Math.sin(hourAngle),Math.cos(hourAngle)*Math.sin(lat)-Math.tan(dec)*Math.cos(lat))+180,360);
 // Refração atmosférica aproximada (não previsão de clima).
 let correction=0;const te=Math.tan(elevation*rad);
 if(elevation<=85&&elevation>5)correction=(58.1/te-.07/te**3+.000086/te**5)/3600;
 else if(elevation<=5&&elevation>-.575)correction=(1735+elevation*(-518.2+elevation*(103.4+elevation*(-12.79+elevation*.711))))/3600;
 else if(elevation<=-.575)correction=-20.772/te/3600;
 return {azimuth,elevation,apparentElevation:elevation+correction,declination:dec*deg,equationMinutes};
}
export function sunDirection(azimuth,elevation,site=SOLAR_SITE){
 const a=azimuth*rad,h=elevation*rad,n=site.northClockwiseFromMinusZDegrees*rad;
 return [Math.sin(a+n)*Math.cos(h),Math.sin(h),-Math.cos(a+n)*Math.cos(h)];
}
const eventCache=new Map();
export function solarEvents(day){
 if(!validDate(day))throw Error('Data solar inválida.');if(eventCache.has(day))return eventCache.get(day);
 const start=+localInstant(day,0),result={sunrise:null,sunset:null,dusk:null};let previous=solarPosition(new Date(start)).elevation;
 for(let minutes=5;minutes<=24*60;minutes+=5){
  const now=start+minutes*60000,alt=solarPosition(new Date(now)).elevation;
  for(const [name,threshold,rising]of [['sunrise',-.833,true],['sunset',-.833,false],['dusk',-6,false]]){
   if(result[name]!==null)continue;
   if(rising?previous<threshold&&alt>=threshold:previous>threshold&&alt<=threshold){
    let low=now-300000,high=now;for(let k=0;k<22;k++){const middle=(low+high)/2,val=solarPosition(new Date(middle)).elevation;if(rising?val<threshold:val>threshold)low=middle;else high=middle;}
    result[name]=new Date((low+high)/2);
   }
  }previous=alt;
 }
 Object.freeze(result);eventCache.set(day,result);if(eventCache.size>24)eventCache.delete(eventCache.keys().next().value);return result;
}
export function simulation(day=localDate(),period='tarde'){
 if(!validDate(day))day=localDate();if(!PERIODS.includes(period))period='tarde';const events=solarEvents(day);
 const instant=period==='manha'?localInstant(day,8):period==='tarde'?localInstant(day,15):period==='por-do-sol'?new Date(+(events.sunset||localInstant(day,18))-12*60000):new Date(+(events.dusk||localInstant(day,19))+35*60000);
 const position=solarPosition(instant),local=localParts(instant);
 return {date:day,period,instant:instant.toISOString(),localTime:`${local.hour}:${local.minute}`,timeZone:SOLAR_SITE.timeZone,...position,direction:sunDirection(position.azimuth,position.apparentElevation),events:{sunrise:events.sunrise?.toISOString(),sunset:events.sunset?.toISOString(),dusk:events.dusk?.toISOString()},lightsOn:position.elevation<6};
}
