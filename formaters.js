const CLEANER_REGEX = /\s*[^\x20-\x7E]*\s*\\r\\n\s*/gm;

const euroToFloat = function (price) {
	let split = price.split(' ');
	split.pop();
	split.pop();

	return parseFloat(split.join('').replace(',', '.'));
}

const stringClean = function (data) {
	return data.replace(CLEANER_REGEX, '$');
}

const reverseDayMonth = function (date) {
	fmt = date.split('/')

	return fmt[1] + '/' + fmt[0] + '/' + fmt[2];
}

const parseDateString = function (date) {

	function pad(number) {
		if (number < 10) {
			return '0' + number;
		}

		return number;
	}

	return date.getUTCFullYear() +
		'-' + pad(date.getMonth() + 1) +
		'-' + pad(date.getDate()) +
		' ' + pad(date.getHours()) +
		':' + pad(date.getMinutes()) +
		':' + pad(date.getSeconds()) +
		'.' + (date.getMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z';
}

const fmtDate = function (dateArray) {
	let dates = [];

	for (let elem of dateArray) {
		let formated = elem.trim()
			.replace(/[^\x20-\x7E]/gm, ' ')
			.split(' ')
			.filter(String);

		formated1 = parseDateString(new Date(reverseDayMonth(formated[5])));
		formated2 = parseDateString(new Date(reverseDayMonth(formated[7])));

		dates.push(formated1);
		dates.push(formated2);
	}

	return dates;
}

const passengerFormater = function (elem) {

	const res = elem.map((pass) => {
		return pass.match(/(\([0-9]?[0-9] à [0-9]?[0-9] ans\))/g);
	});

	res.pop();
	res.pop();
	return res;
}

module.exports = {
	euroToFloat,
	passengerFormater,
	stringClean,
	reverseDayMonth,
	parseDateString,
	fmtDate,
	CLEANER_REGEX
}