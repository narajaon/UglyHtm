const fs = require('fs');
const { parse } = require('node-html-parser');

const euroToFloat = function (price) {
	let split = price.split(' ');
	split.pop();
	split.pop();
	return parseFloat(split.join('').replace(',', '.'));
}

const stringClean = function (data) {
	return data.replace(/\s*[^\x20-\x7E]*\s*\\r\\n\s*/gm, '$');
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

const getRoundTrips = function (details, date) {
	return {
		type: details[0],
		date: date,
		trains: [{
			departureTime: details[1].replace('h', ':'),
			departureStation: details[2],
			arrivalTime: details[6].replace('h', ':'),
			arrivalStation: details[7],
			type: details[3],
			number: details[4],
			// class: details[5],
		}]
	};
}

const fmtPassengers = function (elem) {
	return false;
}

fs.readFile('./test.html', 'utf8', function (err, data) {
	if (err) throw err;

	const parsed = parse(data);

	// get trips values
	const name = parsed.querySelectorAll('span.\\\"pnr-info\\\"')[1].text.trim();
	const code = parsed.querySelectorAll('span.\\\"pnr-info\\\"')[4].text.trim();
	const price = parsed.querySelector('td.\\\"very-important\\\"').text;
	const fmtPrice = euroToFloat(price);
	const travelWay = parsed.querySelectorAll('table.\\\"product-details\\\"');

	// filter passengers
	const placement = parsed.querySelectorAll('table.\\\"passengers\\\"');

	// format date values
	const travelDate = parsed.querySelectorAll('td.\\\"pnr-summary\\\"');
	const dates = travelDate.map(e => e.childNodes[0].text);
	const formatedDates = fmtDate(dates);

	// parse roundTrips
	const roundTrips = travelWay.map((elem, i) => {
		let cleaned = stringClean(elem.text);
		let split = cleaned.split('$').filter(String);

		return getRoundTrips(split, formatedDates[i]);
	})

	// parse product-header
	const prodHeader1 = parsed.querySelectorAll('tr.\\\"product-header\\\"');
	const prodHeader2 = parsed.querySelectorAll('table.\\\"product-header\\\"');
	const amounts1 = prodHeader1.map((val) => {
		console.log(val.text.replace(/\s*[^\x20-\x7E]*\s*\\r\\n\s*/gm, ' '));
	})

	const amounts2 = prodHeader2.map((val) => {
		console.log(val.text.replace(/\s*[^\x20-\x7E]*\s*\\r\\n\s*/gm, ' '));
	})

	finalRes = {
		status: 'ok',
		result: {
			trips: [{
				code,
				name,
				details: {
					price: fmtPrice,
					roundTrips
				}
			}],
			custom: {
				prices: [

				]
			}
		}
	};

	let fileContent = JSON.stringify(finalRes, null, 2);
	fs.writeFile('test2.json', fileContent, (err) => {
		if (err) throw err;
	})
});
