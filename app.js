const fs = require('fs');
const { parse } = require('node-html-parser');
const {
	euroToFloat,
	stringClean,
	fmtDate,
	passengerFormater,
	CLEANER_REGEX
} = require('./formaters')

const CL = console.log;

const getRoundTrips = function (details, date, passengers) {

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
			passengers,
		}]
	};
}

const readErrorHandler = function (e) {
	const errorObj = {
		status: 'ko',
		result: e
	}

	return JSON.stringify(errorObj, null, 2);
}

const isRefundable = function (input) {
	let res = input.search(/Billet échangeable et remboursable sans frais à l'émission du billet/g);
	return (res > 0) ? 'échangeable' : 'non échangeable';
}

fs.readFile('./test.html', 'utf8', function (err, data) {
	if (err) {
		return fs.writeFile('test2.json', readErrorHandler(err), (err) => {
			if (err) throw err;
		});
	}

	const parsed = parse(data);

	// get trips values
	const name = parsed.querySelectorAll('span.\\\"pnr-info\\\"')[1].text.trim();
	const code = parsed.querySelectorAll('span.\\\"pnr-info\\\"')[4].text.trim();
	const price = parsed.querySelector('td.\\\"very-important\\\"').text;
	const fmtPrice = euroToFloat(price);
	const travelWay = parsed.querySelectorAll('table.\\\"product-details\\\"');

	// filter passengers
	const placement = parsed.querySelectorAll('table.\\\"passengers\\\"');
	const passengers = placement.map((elem) => {
		const res = elem.text.replace(CLEANER_REGEX, ' ').trim();

		return res;
	})
	const fmtPassengers = passengerFormater(passengers);

	// format date values
	const travelDate = parsed.querySelectorAll('td.\\\"pnr-summary\\\"');
	const dates = travelDate.map(e => e.childNodes[0].text);
	const formatedDates = fmtDate(dates);

	// parse roundTrips
	const roundTrips = travelWay.map((elem, i) => {
		const cleaned = stringClean(elem.text);
		const split = cleaned.split('$').filter(String);

		const finalPassengers = fmtPassengers[i].map((elem, j) => {
			return {
				type: isRefundable(passengers[j]),
				age: elem,
			};
		});

		return getRoundTrips(split, formatedDates[i], finalPassengers);
	})

	// parse product-header
	const prodHeader1 = parsed.querySelectorAll('tr.\\\"product-header\\\"');
	const prodHeader2 = parsed.querySelectorAll('table.\\\"product-header\\\"');

	const amounts1 = prodHeader2.map((val) => {
		const res = val.text.replace(CLEANER_REGEX, ' ').split(' ');
		res.pop();
		res.pop();
		res.pop();

		return { value: parseFloat(res.pop().replace(',', '.')) };
	})

	const amounts2 = prodHeader1.map((val) => {
		const res = val.text.replace(CLEANER_REGEX, ' ').trim().split(' ').pop();

		return { value: parseFloat(res.replace(',', '.')) };
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
				prices: [...amounts1, ...amounts2]
			}
		}
	};

	fs.writeFile('test2.json', JSON.stringify(finalRes, null, 2), (err) => {
		if (err) throw err;
	})
});