// Result Actions Script for Deutschland-rechnet.de
// Provides copy result and save as PDF functionality for calculators

document.addEventListener('DOMContentLoaded', function() {
    // Copy result functionality
    const copyButtons = document.querySelectorAll('[data-copy-result]');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const resultElement = document.querySelector(this.getAttribute('data-copy-result'));
            if (resultElement) {
                const resultText = resultElement.textContent || resultElement.value || '';
                navigator.clipboard.writeText(resultText).then(() => {
                    // Show temporary success message
                    const originalText = button.textContent;
                    button.textContent = 'Kopiert!';
                    setTimeout(() => {
                        button.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    button.textContent = 'Fehler!';
                    setTimeout(() => {
                        button.textContent = originalText;
                    }, 2000);
                });
            }
        });
    });

    // Save as PDF functionality
    const savePdfButtons = document.querySelectorAll('[data-save-pdf]');
    savePdfButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetElement = document.querySelector(this.getAttribute('data-save-pdf'));
            if (targetElement) {
                // Use browser's print functionality to save as PDF
                window.print();
            }
        });
    });

    // Alternative: Save specific section as PDF using html2pdf.js if available
    // For now, we'll rely on window.print() which users can configure to save as PDF
});