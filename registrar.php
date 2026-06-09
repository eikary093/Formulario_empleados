<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Origin: *");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "Método HTTP no permitido. Use POST."
    ]);
    exit;
}

$jsonInput = file_get_contents("php://input");
$data = json_decode($jsonInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Cuerpo de solicitud vacío o estructura JSON no válida."
    ]);
    exit;
}

$nombre = isset($data['nombre']) ? trim($data['nombre']) : '';
$cedula = isset($data['cedula']) ? trim($data['cedula']) : '';
$cargo = isset($data['cargo']) ? trim($data['cargo']) : '';
$departamento = isset($data['departamento']) ? trim($data['departamento']) : '';
$otro_departamento = isset($data['otro_departamento']) ? trim($data['otro_departamento']) : '';
$fecha_ingreso = isset($data['fecha_ingreso']) ? trim($data['fecha_ingreso']) : '';

if (preg_match('/^\d+$/', $cedula)) {
    $cedula = 'V-' . $cedula;
}

$serverErrors = [];

if (strlen($nombre) < 3 || strlen($nombre) > 100) {
    $serverErrors['nombre'] = "El nombre debe contener entre 3 y 100 caracteres.";
}
if (!preg_match('/^(?:[VEve]-)?\d{5,9}$/', $cedula)) {
    $serverErrors['cedula'] = "Formato de cédula inválido. Ej: V-12345678";
}
if (strlen($cargo) < 3 || strlen($cargo) > 80) {
    $serverErrors['cargo'] = "El cargo debe contener entre 3 y 80 caracteres.";
}

if (empty($departamento)) {
    $serverErrors['departamento'] = "Debe seleccionar un departamento válido.";
}

if (strcasecmp($departamento, 'Otros') === 0) {
    if (strlen($otro_departamento) < 3 || strlen($otro_departamento) > 50) {
        $serverErrors['otro_departamento'] = "Especifique el área (entre 3 y 50 caracteres).";
    }
}

if (empty($fecha_ingreso) || !strtotime($fecha_ingreso)) {
    $serverErrors['fecha_ingreso'] = "La fecha ingresada no es válida.";
}

if (!empty($serverErrors)) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "No se superaron las pruebas de validación en el servidor.",
        "errors" => $serverErrors
    ]);
    exit;
}

if (strcasecmp($departamento, 'Otros') === 0 && !empty($otro_departamento)) {
    $departamento_final = $otro_departamento;
} else {
    $departamento_final = $departamento;
}

// Conexión a la Base de Datos
$host = "localhost";
$db_name = "gestion_maestra";
$username = "root"; 
$password = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // Verificar si la cédula ya existe
    $checkStmt = $pdo->prepare("SELECT id FROM empleados WHERE cedula = :cedula LIMIT 1");
    $checkStmt->execute([':cedula' => $cedula]);
    
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode([
            "status" => "error",
            "message" => "Conflicto de duplicidad de datos.",
            "errors" => ["cedula" => "Esta cédula de identidad ya se encuentra registrada."]
        ]);
        exit;
    }

    $sql = "INSERT INTO empleados (nombre, cedula, cargo, departamento, fecha_ingreso) 
            VALUES (:nombre, :cedula, :cargo, :departamento, :fecha_ingreso)";
    
    $stmt = $pdo->prepare($sql);
    
    $stmt->execute([
        ':nombre'        => $nombre,
        ':cedula'        => $cedula,
        ':cargo'         => $cargo,
        ':departamento'  => $departamento_final, //  CORRECCIÓN 2: Pasamos la variable procesada
        ':fecha_ingreso' => $fecha_ingreso
    ]);

    http_response_code(201);
    echo json_encode([
        "status" => "success",
        "message" => "¡Registrado exitosamente!"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Error interno en el servidor: " . $e->getMessage()
    ]);
}
?>