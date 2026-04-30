<?php
/**
 * Lightweight SMTP Mailer
 * Simple SMTP client using sockets for environments without PHPMailer
 */

class SMTPMailer {
    private $host;
    private $port;
    private $user;
    private $pass;
    private $debug = false;
    private $timeout = 10;
    private $lastError = "";

    public function __construct($host, $port, $user, $pass) {
        $this->host = $host;
        $this->port = $port;
        $this->user = $user;
        $this->pass = $pass;
    }

    public function getLastError() {
        return $this->lastError;
    }

    private function getResponse($socket) {
        $response = "";
        while ($str = fgets($socket, 515)) {
            $response .= $str;
            if (substr($str, 3, 1) == " ") break;
        }
        return $response;
    }

    private function sendCommand($socket, $command) {
        fputs($socket, $command . "\r\n");
        return $this->getResponse($socket);
    }

    public function send($to, $subject, $message, $fromEmail, $fromName) {
        $isSSL = ($this->port == 465);
        $host = $isSSL ? "ssl://{$this->host}:{$this->port}" : "tcp://{$this->host}:{$this->port}";
        
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);
        
        $socket = @stream_socket_client($host, $errno, $errstr, $this->timeout, STREAM_CLIENT_CONNECT, $context);
        if (!$socket) {
            $this->lastError = "Connection failed: $errstr ($errno)";
            return false;
        }

        $this->getResponse($socket); // banner
        
        $res = $this->sendCommand($socket, "EHLO " . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
        
        // StartTLS for port 587 or 25
        if (!$isSSL) {
            $res = $this->sendCommand($socket, "STARTTLS");
            if (substr($res, 0, 3) === '220') {
                if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    $this->lastError = "Failed to start TLS encryption";
                    return false;
                }
                // Resend EHLO after TLS
                $this->sendCommand($socket, "EHLO " . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
            }
        }
        
        // Auth
        $res = $this->sendCommand($socket, "AUTH LOGIN");
        $res = $this->sendCommand($socket, base64_encode($this->user));
        $res = $this->sendCommand($socket, base64_encode($this->pass));
        if (substr($res, 0, 3) !== '235') { $this->lastError = "Auth failed: $res"; return false; }
        
        // Mail
        $this->sendCommand($socket, "MAIL FROM: <{$this->user}>");
        $this->sendCommand($socket, "RCPT TO: <{$to}>");
        $res = $this->sendCommand($socket, "DATA");
        if (substr($res, 0, 3) !== '354') { $this->lastError = "DATA command failed: $res"; return false; }
        
        // Headers
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=utf-8\r\n";
        $headers .= "Content-Transfer-Encoding: base64\r\n";
        $headers .= "To: <{$to}>\r\n";
        $headers .= "From: {$fromName} <{$this->user}>\r\n";
        $headers .= "Reply-To: <{$fromEmail}>\r\n";
        $headers .= "Subject: {$subject}\r\n";
        $headers .= "Date: " . date('r') . "\r\n";
        $headers .= "\r\n";
        
        // Chunk split base64 string to meet SMTP line length limits (76 chars)
        $encodedMessage = chunk_split(base64_encode($message));
        
        $res = $this->sendCommand($socket, $headers . $encodedMessage . "\r\n.");
        if (substr($res, 0, 3) !== '250') { $this->lastError = "Message send failed: $res"; return false; }
        
        $this->sendCommand($socket, "QUIT");
        
        fclose($socket);
        return true;
    }
}
