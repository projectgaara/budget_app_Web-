<?php
function debug($message, $data = null) {
    if (defined('DEBUG') && DEBUG) {
        $output = "[" . date('Y-m-d H:i:s') . "] " . $message;
        if ($data !== null) {
            $output .= ": " . print_r($data, true);
        }
        error_log($output . "\n", 3, __DIR__ . '/debug.log');
    }
}
?>