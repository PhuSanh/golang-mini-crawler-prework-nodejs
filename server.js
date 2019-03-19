const cheerio = require('cheerio');
const request = require('request');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;  

const host = "https://www.thesaigontimes.vn";
const url = "https://www.thesaigontimes.vn/121624/Cuoc-cach-mang-dau-khi-da-phien.html";

doRequest = url => {
	return new Promise((resolve, reject) => {
		request(url, (err, res, body) => {
			if (!err && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(err);
      }
		})
	})
}

getInfo = $ => {
	
	const title = $("#ctl00_cphContent_lblTitleHtml").text();
	const author = $("#ctl00_cphContent_Lbl_Author").text();
	const date = $("#ctl00_cphContent_lblCreateDate").text();

	return {
		title,
		author,
		date,
	}
}

main = async () => {

	console.log("crawling data ...")

	let data = [];

	const body = await doRequest(url);
	const $ = cheerio.load(body);

	const parentResult = getInfo($);
	data.push({
		url,
		title: parentResult.title,
		author: parentResult.author,
		date: parentResult.date
	})

	const relatives = $("#ctl00_cphContent_Article_LienQuan .Item1");

	for(let i in relatives) {
		const item = relatives[i];
		const href = $("a", item).attr("href")
		const childUrl = `${host}${href}`;
		if(!href) break;
		const childBody = await doRequest(childUrl);
		const $child = cheerio.load(childBody)
		const { title, author, date } = getInfo($child);
		data.push({
			url: childUrl,
			title,
			author,
			date
		})
	}

	
	const csvWriter = createCsvWriter({  
		path: "result.csv",
		header: [
			{id: "url", title: "URL"},
			{id: "title", title: "Title"},
			{id: "author", title: "Author"},
			{id: "date", title: "Date"},
		]
	});

	csvWriter  
		.writeRecords(data)
		.then(()=> console.log('The CSV file was written successfully'));
}

main();