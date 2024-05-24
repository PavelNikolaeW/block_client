
// Alpine.directive('[name]', (el, { value, modifiers, expression }, { Alpine, effect, cleanup }) => {})
export default function grid(el, {expression}, {evaluateLater, effect}) {
    effect(() => {
        console.log(this)
        const blockId = this.$data.app.allblocks.get(el.getAttribute('blockID'))
        console.log(blockId, el.offsetWidth, el.offsetHeight)
    });

}