<script>

    const strings = [
		"More than a game.",
		"Better than sex.",
		"Circumstance does not make the man; it reveals him to himself.",
		"And man, therefore, as the lord and master of thought, is the maker of himself and the author of environment.",
		"Men are anxious to improve their circumstances, but are unwilling to improve themselves, they therefore remain bound.",
		"The man who does not shrink from self-crucifixion can never fail to accomplish the object which his heart is set.",
		"There is no difference between a hero and a coward in what they feel. It's what they do that makes them different.",
		"Don't be afraid to give up the good for the great.",
		"If you wish to succeed you should strike out on new paths, rather than travel the worn paths of accepted success.",
		"I do not think that there is any other quality so essential to success of any kind as the quality of perseverance. It overcomes almost everything, even nature.",
		"The older people want to know how it does what it does, but the younger people want to know what it can do.",
		"The meek will inherit the earth. However after they inherit the earth, will they remain meek?",
    ];

    const str = strings[Math.floor(Math.random() * strings.length)];

</script>

<div >
    {str}
</div>

<style>
    div {
        text-align: center;

        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%); /* shift back by half width/height */

        width: max-content;
    }
</style>
