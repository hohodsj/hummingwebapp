let buttons = document.querySelectorAll('.btn-danger');
buttons.forEach(button => {
    button.onclick = (event) => confirm(`You are about to delete ${button.value}, do you want to proceed?`);
})