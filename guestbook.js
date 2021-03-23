const http = require('http');
const gzmo = require('mygzobjects');

http.createServer((req, res) => {
	
	const urlObj = requre('url').parse(req.url, true, false);  
	
  
	if (urlObj.pathname.endsWith('guestbook')) 	{
		res.setHeader("Content-Type", "text/html");
		res.writeHead(200);
		res.write('<html><head><title>Guestbook</title></head>\n');
		res.write('<body>\n');
		res.write('<h1>Fill in my guestbook!</h1>\n');
		res.write('<form method="get" action="/guestbook_store">\n');
		res.write('First Name: <input type="text" name="first"><br>\n');
		res.write('Last Name: <input type="text" name="last"><br><br>\n');
		res.write('Comment: <textarea name="comment"></textarea><br><br>\n');
		res.write('<input type="submit"> <input type="reset">\n');
		res.write('</form>\n');
		res.end('\n</body>\n</html>\n');
	} else if (urlObj.pathname.endsWith('guestbook_store')) {
		res.setHeader("Content-Type", "text/html");
		res.writeHead(200);
		res.write('<html><head><title>Guestbook</title></head>\n');
		res.write('<body>\n');
		res.write('<h1>Guestbook Entry</h1>');
		res.write('<ul>');
		res.write("<li>Name: " + urlObj.query.first + " " + urlObj.query.last + "</li>\n");	  
		res.write("<li>Comment: " + urlObj.query.comment + "</li>\n");	  
		res.write('</ul>\n');	  
		res.end('\n</body>\n</html>\n');
		
		gzmo.addObject(urlObj.query);
		gzmo.writeGZObjects("guestbook.json.gz");
	} else if (urlObj.pathname.endsWith('guestbook_view')) {		
		gzmo.getGZObjectsArray('guestbook.json.gz', (objs) => {		
			res.setHeader("Content-Type", "text/html");
			res.writeHead(200);
			res.write('<html><head><title>Guestbook</title></head>\n');
			res.write('<body>\n');
			res.write('<h1>View my guestbook!</h1>\n');
			res.write('<table border = "1">');
			objs.forEach((ele) => {
				res.write("<tr><td>");
				res.write(ele.first + ' ' + ele.last);
				res.write('</td><td>');
				res.write(ele.comment);
				res.write('</td></tr>');
			});
			res.write('</table>');			
			res.end('\n</body>\n</html>\n');
		});
	}
	else 
	{
		console.log(urlObj.pathname);
		res.writeHead(404); 
		res.write('<html><head><title>Guestbook</title></head>\n');
		res.write('<body>\n');
		res.write('<h1>Resource not found<h1>');
		res.end('\n</body>\n</html>\n');			  
		res.end();
		return;
	}	
}).listen(3045);

