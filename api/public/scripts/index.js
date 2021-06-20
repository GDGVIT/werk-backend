
console.log('hellooo')
const button = document.getElementById('submitButton')
const input = document.getElementById('inputPassword')
const label = document.getElementById('passwordHelp')
input.addEventListener('input', (e) => {
  const length = e.target.value.length
  if (length < 5) {
    button.disabled = true
    label.style.color = 'red'
  } else {
    button.disabled = false
    label.style.color = 'green'
  }
})
