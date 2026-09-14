const $ = id => document.getElementById(id);

/* Valores orientativos para 15 FPS. Son estimaciones, no sustituyen el bitrate real. */
const baseMbps = {
  1: 1.0,
  2: 2.0,
  3: 2.5,
  4: 3.0,
  5: 4.0,
  6: 5.0,
  8: 6.0,
  12: 8.0
};

function clearErrors(){
  ['cams','fps','bitrate'].forEach(id=>{
    $(id).classList.remove('invalid');
    const error=$(id+'Error');
    if(error) error.textContent='';
  });
}

function setError(id,message){
  $(id).classList.add('invalid');
  const error=$(id+'Error');
  if(error) error.textContent=message;
}

function estimateBitrate(){
  const mp=Number($('resolution').value);
  const fps=Number($('fps').value);
  const codec=$('codec').value;

  let b=(baseMbps[mp] || 2) * (fps/15);

  if(codec==='h264') b*=1.5;
  if(codec==='h265p') b*=0.65;

  return Math.max(0.1,b);
}

function resetResult(message='Revisa los datos introducidos antes de calcular.'){
  $('raw').textContent='—';
  $('total').textContent='—';
  $('per').textContent='—';
  $('mbytes').textContent='—';
  $('gbhour').textContent='—';
  $('network').textContent=message;
}

function calculate(){
  clearErrors();

  const cams=Number($('cams').value);
  const overhead=Number($('overhead').value);
  const mode=$('mode').value;

  let valid=true;

  if($('cams').value==='' || !Number.isFinite(cams) || !Number.isInteger(cams) || cams<1 || cams>1000){
    setError('cams','Introduce un número entero entre 1 y 1000.');
    valid=false;
  }

  if(!mode) valid=false;
  if(!overhead) valid=false;

  let finalBitrate;

  if(mode==='manual'){
    const bitrate=Number($('bitrate').value);

    if($('bitrate').value==='' || !Number.isFinite(bitrate) || bitrate<=0 || bitrate>100){
      setError('bitrate','Introduce un bitrate mayor que 0 y hasta 100 Mbps.');
      valid=false;
    }else{
      finalBitrate=bitrate;
    }
  }

  if(mode==='auto'){
    const resolution=$('resolution').value;
    const codec=$('codec').value;
    const fps=Number($('fps').value);

    if(!resolution || !codec) valid=false;

    if($('fps').value==='' || !Number.isFinite(fps) || !Number.isInteger(fps) || fps<1 || fps>120){
      setError('fps','Introduce un número entero entre 1 y 120.');
      valid=false;
    }

    if(valid) finalBitrate=estimateBitrate();
  }

  if(!valid){
    resetResult();
    return;
  }

  const raw=cams*finalBitrate;
  const total=raw*overhead;
  // El margen se aplica al tráfico de red, no al almacenamiento.
  const mbytes=total/8;
  const storageMbytes=raw/8;
  const gbHour=storageMbytes*3.6;

  $('raw').textContent=raw.toFixed(2)+' Mbps';
  $('total').textContent=total.toFixed(2);
  $('per').textContent=finalBitrate.toFixed(2)+' Mbps';
  $('mbytes').textContent=mbytes.toFixed(2)+' MB/s';
  $('gbhour').textContent=gbHour.toFixed(2)+' GB/h';

  if(total<=90){
    $('network').textContent='Una red Gigabit tiene margen de sobra para este tráfico de vídeo.';
  }else if(total<=900){
    $('network').textContent='El tráfico entra dentro de una red Gigabit, pero revisa el resto de cargas y el uplink del switch.';
  }else{
    $('network').textContent='Este tráfico supera 1 Gbps. Revisa uplinks y valora una infraestructura de mayor capacidad.';
  }
}
function updateMode(){
  const manual=$('mode').value==='manual';
  const auto=$('mode').value==='auto';

  $('manualBox').style.display=manual?'block':'none';
  $('autoBox').style.display=auto?'block':'none';
  $('autoHint').style.display=auto?'none':'block';

  clearErrors();
  resetResult('Introduce los datos y pulsa «Calcular ancho de banda».');
}
$('mode').addEventListener('change',updateMode);
$('calc').addEventListener('click',calculate);

['cams','fps','bitrate'].forEach(id=>{
  $(id).addEventListener('input',()=>$(id).classList.remove('invalid'));
});

['resolution','codec','overhead'].forEach(id=>{
  $(id).addEventListener('change',()=>resetResult('Introduce los datos y pulsa «Calcular ancho de banda».'));
});

resetResult('Introduce los datos y pulsa «Calcular ancho de banda».');