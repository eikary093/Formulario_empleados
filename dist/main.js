document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('employee-form');
    const btnSubmit = document.getElementById('btn-submit');
    const btnText = document.getElementById('btn-text');
    const alertContainer = document.getElementById('alert-container');
    const selectDepartamento = document.getElementById('departamento');
    const contenedorOtroDepto = document.getElementById('contenedor-otro-departamento');
    const inputOtroDepartamento = document.getElementById('otro_departamento');

    
    function verificarEstadoDepartamento() {
        if (selectDepartamento.value === 'Otros') {
        
            contenedorOtroDepto.style.setProperty('display', 'block', 'important'); 
            inputOtroDepartamento.setAttribute('required', 'true');
        } else {
            
            contenedorOtroDepto.style.setProperty('display', 'none', 'important'); 
            inputOtroDepartamento.removeAttribute('required');
            inputOtroDepartamento.value = '';
            
            
            const errorOtro = document.getElementById('err-otro_departamento');
            if (errorOtro) errorOtro.classList.add('hidden');
            inputOtroDepartamento.classList.remove('border-error');
        }
    }
    verificarEstadoDepartamento();

    selectDepartamento.addEventListener('change', verificarEstadoDepartamento);

    function showAlert(message, type = 'error') {
        alertContainer.classList.remove('hidden');
        alertContainer.innerHTML = `
            <div class="alert alert-${type} shadow-lg">
                <div>
                    ${type === 'success' ? '✅' : '❌'}
                    <span>${message}</span>
                </div>
            </div>
        `;
        setTimeout(() => {
            alertContainer.classList.add('hidden');
        }, 4000);
    }

    function showFieldError(fieldId, message) {
        const errorSpan = document.getElementById(`err-${fieldId}`);
        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.classList.remove('hidden');
           
            const input = document.getElementById(fieldId);
            if (input) input.classList.add('border-error');
        }
    }

    function clearFieldErrors() {
        const errorSpans = document.querySelectorAll('[id^="err-"]');
        errorSpans.forEach(span => {
            span.textContent = '';
            span.classList.add('hidden');
        });
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.classList.remove('border-error');
        });
    }

    function validateForm() {
        let isValid = true;
        clearFieldErrors();

        const nombre = document.getElementById('nombre').value.trim();
        const cedula = document.getElementById('cedula').value.trim();
        const cargo = document.getElementById('cargo').value.trim();
        const departamento = selectDepartamento.value;
        const fechaIngreso = document.getElementById('fecha_ingreso').value;

        if (nombre.length < 3 || nombre.length > 50) {
            showFieldError('nombre', 'El nombre debe tener entre 3 y 50 caracteres');
            isValid = false;
        }

        const cedulaRegex = /^(?:[VEve]-)?\d{5,9}$/;
        if (!cedulaRegex.test(cedula)) {
            showFieldError('cedula', 'Formato inválido. Ej: V-12345678 o 12345678');
            isValid = false;
        }

        if (cargo.length < 3 || cargo.length > 80) {
            showFieldError('cargo', 'El cargo debe tener entre 3 y 80 caracteres');
            isValid = false;
        }
       
        if (!departamento) {
            showFieldError('departamento', 'Seleccione un departamento');
            isValid = false;
        }

        // Validación "Otros"
        if (departamento === 'Otros') {
            const otroDeptoValue = inputOtroDepartamento.value.trim();
            if (otroDeptoValue.length < 3 || otroDeptoValue.length > 50) {
                showFieldError('otro_departamento', 'Especifique el área (entre 3 y 50 caracteres)');
                isValid = false;
            }
        }

        if (!fechaIngreso) {
            showFieldError('fecha_ingreso', 'Seleccione una fecha de ingreso');
            isValid = false;
        } else {
            const fecha = new Date(fechaIngreso);
            if (fecha > new Date()) {
                showFieldError('fecha_ingreso', 'La fecha no puede ser futura');
                isValid = false;
            }
        }

        return isValid;
    }
        
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }
       
        btnSubmit.disabled = true;
        btnText.innerHTML = 'Procesando...';

        const formData = {
            nombre: document.getElementById('nombre').value.trim(),
            cedula: document.getElementById('cedula').value.trim(),
            cargo: document.getElementById('cargo').value.trim(),
            departamento: selectDepartamento.value,
            otro_departamento: document.getElementById('otro_departamento') ? document.getElementById('otro_departamento').value.trim() : '',
            fecha_ingreso: document.getElementById('fecha_ingreso').value
        };

        try {
            const response = await fetch('registrar.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.status === 'success') {
                showAlert(result.message, 'success');
                form.reset(); 
                verificarEstadoDepartamento(); // Vuelve a ocultar la celda al limpiar el formulario
            } else {
                if (result.errors) {
                    for (const [field, message] of Object.entries(result.errors)) {
                        showFieldError(field, message);
                    }
                }
                showAlert(result.message, 'error');
            }

        } catch (error) {
            console.error('Error:', error);
            showAlert('Error de conexión con el servidor', 'error');
        } finally {
            btnSubmit.disabled = false;
            btnText.innerHTML = 'Finalizar Registro';
        }
    });
});
