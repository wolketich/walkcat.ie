<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\Exception as MailerException;
use PHPMailer\PHPMailer\PHPMailer;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function respond(int $status, string $code, string $message, array $extra = []): never
{
    http_response_code($status);
    echo json_encode(array_merge([
        'ok' => $status >= 200 && $status < 300,
        'code' => $code,
        'message' => $message,
    ], $extra), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function text_field(string $key, int $maxLength = 500): string
{
    $value = $_POST[$key] ?? '';
    if (!is_string($value)) {
        respond(422, 'VALIDATION_ERROR', 'One or more submitted fields are invalid.');
    }
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '');
    return mb_substr($value, 0, $maxLength);
}

function verify_turnstile(string $secret, string $token, string $ip): bool
{
    $handle = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    curl_setopt_array($handle, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query(['secret' => $secret, 'response' => $token, 'remoteip' => $ip]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_CONNECTTIMEOUT => 4,
    ]);
    $response = curl_exec($handle);
    $status = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    curl_close($handle);
    if (!is_string($response) || $status !== 200) {
        return false;
    }
    $payload = json_decode($response, true);
    return is_array($payload) && ($payload['success'] ?? false) === true;
}

function enforce_rate_limit(string $ip, string $salt): void
{
    $key = hash('sha256', $salt . '|' . $ip);
    $file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'tb-rate-' . $key . '.json';
    $now = time();
    $windowStart = $now - 1800;
    $handle = fopen($file, 'c+');
    if ($handle === false) {
        respond(503, 'RATE_LIMIT_UNAVAILABLE', 'The enquiry service is temporarily unavailable. Please call or WhatsApp us.');
    }
    try {
        if (!flock($handle, LOCK_EX)) {
            respond(503, 'RATE_LIMIT_UNAVAILABLE', 'The enquiry service is temporarily unavailable. Please call or WhatsApp us.');
        }
        $contents = stream_get_contents($handle);
        $timestamps = is_string($contents) ? json_decode($contents, true) : [];
        if (!is_array($timestamps)) {
            $timestamps = [];
        }
        $timestamps = array_values(array_filter($timestamps, static fn ($timestamp): bool => is_int($timestamp) && $timestamp >= $windowStart));
        if (count($timestamps) >= 5) {
            respond(429, 'RATE_LIMITED', 'Too many requests have been sent. Please wait before trying again, or contact us by phone.');
        }
        $timestamps[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($timestamps));
        fflush($handle);
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, 'METHOD_NOT_ALLOWED', 'Only POST requests are accepted.');
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 17 * 1024 * 1024) {
    respond(413, 'UPLOAD_TOO_LARGE', 'The combined request is too large. Upload no more than 15 MB of files.');
}

$configPath = getenv('TOPBUILDERS_CONFIG') ?: dirname((string) ($_SERVER['DOCUMENT_ROOT'] ?? __DIR__)) . '/topbuilders-private.php';
if (!is_file($configPath)) {
    respond(503, 'CONFIGURATION_ERROR', 'The enquiry service is not configured. Please call or WhatsApp us.');
}
$config = require $configPath;
if (!is_array($config)) {
    respond(503, 'CONFIGURATION_ERROR', 'The enquiry service is not configured. Please call or WhatsApp us.');
}

$host = strtolower(preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')) ?? '');
$allowedHost = strtolower((string) ($config['allowed_host'] ?? 'www.topbuilders.ie'));
$isLocal = in_array($host, ['localhost', '127.0.0.1'], true);
$allowLocal = ($config['allow_insecure_local_testing'] ?? false) === true;
if ($host !== $allowedHost && !($isLocal && $allowLocal)) {
    respond(403, 'ORIGIN_REJECTED', 'This request did not originate from the Top Builders website.');
}
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== $host) {
    respond(403, 'ORIGIN_REJECTED', 'This request did not originate from the Top Builders website.');
}

if (text_field('website', 200) !== '') {
    respond(400, 'SPAM_REJECTED', 'The submission could not be accepted.');
}
$startedAt = (int) text_field('startedAt', 20);
if ($startedAt < 1 || ((int) floor(microtime(true) * 1000) - $startedAt) < 2500) {
    respond(400, 'SPAM_REJECTED', 'The form was submitted too quickly. Please try again.');
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
enforce_rate_limit($ip, (string) ($config['rate_limit_salt'] ?? 'topbuilders-rate-limit'));

$turnstileSecret = (string) ($config['turnstile_secret'] ?? '');
$turnstileToken = text_field('turnstileToken', 2048);
if (!($isLocal && $allowLocal)) {
    if ($turnstileSecret === '' || $turnstileToken === '' || !verify_turnstile($turnstileSecret, $turnstileToken, $ip)) {
        respond(400, 'SPAM_REJECTED', 'Spam verification failed. Please refresh the page or contact us directly.');
    }
}

$projectType = text_field('projectType', 80);
$area = text_field('area', 80);
$eircode = text_field('eircode', 16);
$stage = text_field('stage', 80);
$timing = text_field('timing', 80);
$budget = text_field('budget', 40);
$message = text_field('message', 3000);
$name = text_field('name', 100);
$phone = text_field('phone', 40);
$email = text_field('email', 180);
$preferredContact = text_field('preferredContact', 30);
$consent = text_field('consent', 10);

$allowedProjectTypes = ['House extension', 'Major renovation', 'Kitchen extension', 'Attic conversion', 'House retrofit', 'One-off home', 'Other'];
$allowedAreas = ['Dublin City', 'South Dublin', 'Fingal / North Dublin', 'Dún Laoghaire–Rathdown', 'North Wicklow', 'Kildare', 'Wider Wicklow', 'Other / not sure'];
$allowedStages = ['Exploring options', 'Sketches or plans', 'Planning in progress', 'Ready to price'];
$allowedTimings = ['As soon as practical', 'Within 3–6 months', 'Within 6–12 months', 'More than 12 months', 'Not sure'];
$allowedBudgets = ['', 'Under €50k', '€50–100k', '€100–200k', '€200k+', 'Not sure'];
$allowedContact = ['Phone', 'WhatsApp', 'Email'];

if (!in_array($projectType, $allowedProjectTypes, true) || !in_array($area, $allowedAreas, true) || !in_array($stage, $allowedStages, true) || !in_array($timing, $allowedTimings, true) || !in_array($budget, $allowedBudgets, true) || !in_array($preferredContact, $allowedContact, true)) {
    respond(422, 'VALIDATION_ERROR', 'Choose valid project options before sending the request.');
}
if ($name === '' || ($phone === '' && $email === '') || $consent !== 'true') {
    respond(422, 'VALIDATION_ERROR', 'Provide your name, at least one contact method, and consent to a response.');
}
if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    respond(422, 'VALIDATION_ERROR', 'Enter a valid email address or leave the email field empty.');
}
if (preg_match('/[\r\n]/', $email . $name . $phone)) {
    respond(422, 'VALIDATION_ERROR', 'The contact details contain invalid characters.');
}

$files = $_FILES['attachments'] ?? null;
$preparedFiles = [];
$totalBytes = 0;
$allowedMimes = [
    'application/pdf' => 'pdf',
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];

if (is_array($files) && isset($files['name'])) {
    $names = is_array($files['name']) ? $files['name'] : [$files['name']];
    $tmpNames = is_array($files['tmp_name']) ? $files['tmp_name'] : [$files['tmp_name']];
    $sizes = is_array($files['size']) ? $files['size'] : [$files['size']];
    $errors = is_array($files['error']) ? $files['error'] : [$files['error']];
    if (count($names) > 3) {
        respond(422, 'UPLOAD_INVALID', 'Upload no more than three files.');
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    foreach ($names as $index => $originalName) {
        $error = (int) ($errors[$index] ?? UPLOAD_ERR_NO_FILE);
        if ($error === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($error !== UPLOAD_ERR_OK) {
            respond(422, 'UPLOAD_FAILED', 'One of the files could not be uploaded.');
        }
        $size = (int) ($sizes[$index] ?? 0);
        $tmpName = (string) ($tmpNames[$index] ?? '');
        if ($size < 1 || $size > 5 * 1024 * 1024 || !is_uploaded_file($tmpName)) {
            respond(422, 'UPLOAD_INVALID', 'Each file must be no larger than 5 MB.');
        }
        $totalBytes += $size;
        if ($totalBytes > 15 * 1024 * 1024) {
            respond(422, 'UPLOAD_TOO_LARGE', 'The combined upload must be 15 MB or less.');
        }
        $mime = $finfo->file($tmpName);
        if (!is_string($mime) || !isset($allowedMimes[$mime])) {
            respond(422, 'UPLOAD_INVALID', 'Only PDF, JPG, PNG and WebP files are accepted.');
        }
        $safePath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'tb-upload-' . bin2hex(random_bytes(12)) . '.' . $allowedMimes[$mime];
        if (!move_uploaded_file($tmpName, $safePath)) {
            respond(500, 'UPLOAD_FAILED', 'A file could not be prepared for delivery.');
        }
        $preparedFiles[] = ['path' => $safePath, 'name' => basename((string) $originalName), 'mime' => $mime];
    }
}

$reference = 'TB-' . gmdate('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
$autoload = __DIR__ . '/vendor/autoload.php';
if (!is_file($autoload)) {
    foreach ($preparedFiles as $prepared) {
        @unlink($prepared['path']);
    }
    respond(503, 'CONFIGURATION_ERROR', 'The mail service is not installed. Please call or WhatsApp us.');
}
require $autoload;

$rows = [
    'Reference' => $reference,
    'Project type' => $projectType,
    'Area' => $area,
    'Eircode' => $eircode ?: 'Not supplied',
    'Stage' => $stage,
    'Timing' => $timing,
    'Budget' => $budget ?: 'Not supplied',
    'Name' => $name,
    'Phone' => $phone ?: 'Not supplied',
    'Email' => $email ?: 'Not supplied',
    'Preferred contact' => $preferredContact,
    'Message' => $message ?: 'Not supplied',
];
$escape = static fn (string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$htmlRows = '';
foreach ($rows as $label => $value) {
    $htmlRows .= '<tr><th style="text-align:left;padding:8px;border-bottom:1px solid #d3ccbf">' . $escape($label) . '</th><td style="padding:8px;border-bottom:1px solid #d3ccbf">' . nl2br($escape($value)) . '</td></tr>';
}
$plainBody = "Top Builders project enquiry\n\n";
foreach ($rows as $label => $value) {
    $plainBody .= $label . ': ' . $value . "\n";
}

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = (string) $config['smtp_host'];
    $mail->Port = (int) ($config['smtp_port'] ?? 587);
    $mail->SMTPAuth = true;
    $mail->Username = (string) $config['smtp_username'];
    $mail->Password = (string) $config['smtp_password'];
    $encryption = strtolower((string) ($config['smtp_encryption'] ?? 'tls'));
    $mail->SMTPSecure = $encryption === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->CharSet = 'UTF-8';
    $mail->setFrom((string) $config['from_email'], (string) $config['from_name']);
    $mail->addAddress((string) $config['to_email']);
    if ($email !== '') {
        $mail->addReplyTo($email, $name);
    }
    foreach ($preparedFiles as $prepared) {
        $mail->addAttachment($prepared['path'], $prepared['name'], PHPMailer::ENCODING_BASE64, $prepared['mime']);
    }
    $mail->isHTML(true);
    $mail->Subject = '[' . $reference . '] ' . $projectType . ' — ' . $area;
    $mail->Body = '<h1 style="font-family:Arial,sans-serif">New Top Builders project brief</h1><table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif">' . $htmlRows . '</table>';
    $mail->AltBody = $plainBody;
    $mail->send();
} catch (MailerException $exception) {
    error_log('Top Builders mail failure [' . $reference . ']: ' . $exception->getMessage());
    respond(502, 'MAIL_FAILED', 'The request could not be delivered. Please call or WhatsApp us instead.');
} finally {
    foreach ($preparedFiles as $prepared) {
        @unlink($prepared['path']);
    }
}

respond(200, 'SENT', 'Your project request has been sent.', ['referenceId' => $reference]);
