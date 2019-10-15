const http = require('https');
const fs = require('fs');
const port = 443;  //포트
const pathName = './html/index.html';

const options = {
    key: fs.readFileSync('D:/openssl/bin/private.key'),
    cert: fs.readFileSync('D:/openssl/bin/private.crt')
};

const server = http.createServer(options, function(request, response) {  //일반 HTTP 요청 처리
    fs.readFile(pathName, function (err, data) {
        if (err) {
            response.writeHead(404, { 'Content-Type': 'text/html' });
        } else {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.write(data.toString());
        }
        response.end();
    });
});

server.listen(port, function() {
    console.log((new Date()) + ' Server is listening on port 443');
});


//signal server area -------------------------------------------------------------------------------
const WebSocketServer = require('websocket').server;
const wsServer = new WebSocketServer({ 
    httpServer: server, //기존에 만든 http서버를 활용
    autoAcceptConnections: false  //true인경우 서버가 허용하지 않는 기타 요청도 가능해짐
});

const rooms = new Map(); //커넥션을 담을 객체

wsServer.on('request', function(request) {  //응답을 받는다.
    const user = request.resourceURL.query.user;  //사용자 ID
    var connection = request.accept();   //들어온 커넥션 객체
    rooms.set(user,{con:connection});  //커넥션 추가
    connection.on('message', function(message) {  //서로의 메시징이 도달하면
        for(let target of rooms.entries()) {  //전달
            if (message.type === 'utf8') {
                console.log('Received : ' + message.utf8Data);
                target[1].con.sendUTF(message.utf8Data);
            }
            else if (message.type === 'binary') {
                console.log('Received Binary');
                target[1].con.sendBytes(message.binaryData);
            }
        }
    });
    connection.on('close', function(reasonCode, description) {   //커넥션이 끊기면
        rooms.delete(user);  //삭제
    });
});