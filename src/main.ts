// Interfaces para el tipado estricto de las respuestas de servidor
interface ServerResponse {
    status: 'success' | 'error';
    message: string;
    errors?: Record<string, string>;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('employee-form') as HTMLFormElement;
    const alertContainer = document.getElementById('alert-container') as HTMLDivElement;
    const btnSubmit = document.getElementById('btn-submit') as HTMLButtonElement;
    const btnText = document.getElementById('btn-text') as HTMLSpanElement;

    if (!form) return;

    form.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        resetFormErrors();

       
        const formData = new FormData(form);
        const data = {
            nombre: (formData.get('nombre') as string).trim(),
            cedula: (formData.get('cedula') as string).trim(),
            cargo: (formData.get('cargo') as string).trim(),
            departamento: (formData.get('departamento') as string) || '',
            fecha_ingreso: (formData.get('fecha_ingreso') as string).trim()
        };

        
        let isValid = true;

        if (data.nombre.length < 3 || data.nombre.length > 100) {
            showInputError('nombre', 'El nombre debe contener entre 3 y 100 caracteres.');
            isValid = false;
        }

        // Validación  V-/E-
        const cedulaRegex = /^(?:[VEve]-)?\d{5,9}$/;
        if (!cedulaRegex.test(data.cedula)) {
            showInputError('cedula', 'Formato de cédula inválido (Ej: 12345678 o V-12345678).');
            isValid = false;
        }

        if (data.cargo.length < 3 || data.cargo.length > 100) {
            showInputError('cargo', 'El cargo debe contener entre 3 y 100 caracteres.');
            isValid = false;
        }

        if (!data.departamento) {
            showInputError('departamento', 'Debe seleccionar un departamento válido.');
            isValid = false;
        }

        if (!data.fecha_ingreso) {
            showInputError('fecha_ingreso', 'La fecha de ingreso es obligatoria.');
            isValid = false;
        }

        if (!isValid) return;

        try {
            setLoadingState(true);

            const response = await fetch('registrar.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Error en la comunicación con el servidor de datos.');
            }

            const result: ServerResponse = await response.json();

            if (result.status === 'success') {
                showAlert('alert-success', result.message);
                form.reset();
            } else {
                if (result.errors) {
                    // Si el servidor devolvió errores específicos de campo (ej: Cédula duplicada)
                    Object.keys(result.errors).forEach(key => {
                        showInputError(key, (result.errors as any)[key]);
                    });
                }
                showAlert('alert-error', result.message);
            }
        } catch (error: any) {
            showAlert('alert-error', error.message || 'Error inesperado al procesar la solicitud.');
        } finally {
            setLoadingState(false);
        }
    });

    function showInputError(fieldId: string, message: string): void {
        const inputElement = document.getElementById(fieldId);
        const errorSpan = document.getElementById(`err-${fieldId}`);
        if (inputElement) inputElement.classList.add('input-error', 'select-error');
        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.classList.remove('hidden');
        }
    }

    function resetFormErrors(): void {
        alertContainer.className = 'mb-4 hidden';
        alertContainer.innerHTML = '';
        const inputs = form.querySelectorAll('.input, .select');
        inputs.forEach(input => input.classList.remove('input-error', 'select-error'));
        const errorSpans = form.querySelectorAll('[id^="err-"]');
        errorSpans.forEach(span => span.classList.add('hidden'));
    }

    function showAlert(type: 'alert-success' | 'alert-error', message: string): void {
        alertContainer.className = `alert ${type} shadow-lg mb-4`;
        const svgIcon = type === 'alert-success' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
        
        alertContainer.innerHTML = `
            <div>
                ${svgIcon}
                <span>${message}</span>
            </div>
        `;
        alertContainer.classList.remove('hidden');
    }

    function setLoadingState(isLoading: boolean): void {
        if (isLoading) {
            btnSubmit.disabled = true;
            btnText.textContent = 'Procesando registro...';
        } else {
            btnSubmit.disabled = false;
            btnText.textContent = 'Registrar Empleado';
        }
    }
});
