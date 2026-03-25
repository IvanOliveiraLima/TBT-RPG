export function att_attack() {
	var name = document.querySelector('#attack-form input[name="name"]').value;
	var stat = document.querySelector('#attack-form select[name="stat"]').value;
	var base = parseInt(document.querySelector('#attributes input[name="' + stat + '-mod"]').value) || 0;
	var dice = document.querySelector('#attack-form input[name="dice"]').value;
	var bonus = parseInt(document.querySelector('#attack-form input[name="bonus"]').value) || 0;
	var damage_type = document.querySelector('#attack-form input[name="dmg-type"]').value;

	var to_hit, dc;
	if (document.querySelector('#attack-form select[name="type"]').value == 'toHit') {
		var prof = 0;
		if (document.querySelector('#attack-form input[name="proficiency"]').checked == true) {
			prof = parseInt(document.querySelector('#top-bar input[name="proficiency"]').value) || 0;
		}
		to_hit = ((base + prof + bonus) < 0 ? "" : "+") + (base + prof + bonus);
	} else {
		dc = document.querySelector('#attack-form input[name="dc"]').value;
	}
	var damage_bonus = base + bonus;
	var damage = dice + ((damage_bonus) < 0 ? "" : "+") + damage_bonus;

	document.querySelector('#attacks tbody').insertAdjacentHTML('beforeend',
		`
		<tr>
			<td><input type="text" name="name" value="` + name + `"/></td>
			<td><input type="text" name="stat" value="` + stat + `"/></td>
			<td><input type="text" name="toHit" value="` + (to_hit ? to_hit : dc) + `"/></td>
			<td><input type="text" name="damage" value="` + damage + `"/></td>
			<td><input type="text" name="damage_type" value="` + damage_type + `"/></td>
			<td><button>X</button></td>
		</tr>
		`
	);

	document.dispatchEvent(new Event('sheetChanged'));
}

document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#attack-form select[name="type"]').addEventListener('change', function() {
		if (this.value == 'toHit') {
			document.querySelector('#attack-form #attack-prof').style.display = '';
			document.querySelector('#attack-form #attack-dc').style.display = 'none';
		} else {
			document.querySelector('#attack-form #attack-dc').style.display = '';
			document.querySelector('#attack-form #attack-prof').style.display = 'none';
		}
	});

	document.querySelector('#attack-form input[name="spell-dc"]').addEventListener('change', function() {
		var dc = parseInt(document.querySelector('#top-bar input[name="spell-dc"]').value) || 0;
		document.querySelector('#attack-form input[name="dc"]').value = dc;
	});

	document.querySelector('#attacks tbody').addEventListener('click', function(event) {
		if (event.target.matches('button')) {
			event.target.closest('tr').remove();
			document.dispatchEvent(new Event('sheetChanged'));
		}
	});
});
