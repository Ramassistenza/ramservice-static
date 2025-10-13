<?php
// Mittente e copia interna
$from = "no-reply@ramservice.altervista.org";
$internal = "valutazioni@ramassistenza.it";

// Dati POST
$email   = isset($_POST['email'])   ? trim($_POST['email'])   : "";
$subject = isset($_POST['subject']) ? trim($_POST['subject']) : "Valutazione RAMSERVICE";
$bodyTxt = isset($_POST['body'])    ? trim($_POST['body'])    : "";

if(empty($email) || empty($bodyTxt)){
  echo "ERROR: missing data"; exit;
}

// Headers
$headers  = "From: RAMSERVICE <".$from.">\r\n";
$headers .= "Reply-To: ".$from."\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";

// Estrai righe e foto prodotto
$lines = explode("\n", $bodyTxt);
$rows  = "";
$whTxt = "";
$fotoUrl = "";
foreach($lines as $line){
  $line = trim($line);
  if($line==="") continue;
  $whTxt .= $line."\n";
  if(strpos($line, ":") !== false){
    list($k,$v) = explode(":", $line, 2);
    $k = trim($k); $v = trim($v);
    if(strtolower($k)==="foto prodotto"){ $fotoUrl = $v; continue; }
    $rows .= "<tr>
      <td style='padding:8px 10px; font-weight:600; color:#2563eb;'>".htmlspecialchars($k)."</td>
      <td style='padding:8px 10px;'>".htmlspecialchars($v)."</td>
    </tr>";
  }
}

// WhatsApp link con riepilogo
$waUrl = "https://wa.me/393475941558?text=".urlencode("Ciao, sono interessato a permutare il mio smartphone.\n\n".$whTxt);

// HTML email
$html =
"<html><body style='margin:0;background:#f5f7fb;padding:20px;font-family:Arial,sans-serif;color:#111827'>
  <div style='max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.08)'>
    <div style='background:#2563eb;padding:18px;text-align:center'>
      <img src='https://ramservice.altervista.org/Kiosk/img/logoram.png' alt='RAMSERVICE' style='height:58px'>
    </div>
    <div style='padding:22px'>
      <h2 style='margin:0 0 6px;color:#2563eb'>Ecco la tua valutazione</h2>
      <p style='margin:0 0 10px;color:#334155'>Puoi ottenere <strong>bonifico istantaneo</strong> oppure scalare l’importo su un <strong>nuovo acquisto</strong>.</p>".

    (!empty($fotoUrl) ? "<div style='text-align:center;margin:14px 0'>
      <img src='".htmlspecialchars($fotoUrl)."' alt='Foto prodotto' style='max-width:220px;border-radius:10px;box-shadow:0 6px 16px rgba(0,0,0,.12)'>
    </div>" : "")

    ."<table style='width:100%;border-collapse:collapse;border:1px solid #eef2f7;margin:12px 0;font-size:14px'>$rows</table>
      <p style='text-align:center'>
        <a href='$waUrl' style='display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:8px'>
          <img src='https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg' alt='WA' style='height:18px;vertical-align:middle;margin-right:8px'>
          Avvia subito la permuta su WhatsApp
        </a>
      </p>
      <p style='font-size:12px;color:#64748b;text-align:center;margin:6px 0 0'>Valutazione valida 7 giorni.</p>
    </div>
    <div style='background:#f1f5f9;color:#475569;text-align:center;padding:12px;font-size:12px'>© ".date("Y")." RAMSERVICE</div>
  </div>
</body></html>";

// Invii
$ok1 = mail($email,   $subject, $html, $headers);
$ok2 = mail($internal,$subject, $html, $headers);

// Risposta per fetch()
echo ($ok1 || $ok2) ? "OK" : "ERROR";
