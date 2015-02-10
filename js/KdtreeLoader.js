var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					var obj = eval("(" + xhr.response + ")");
					console.log(obj);

					for (var i = 0; i < obj.length; i++) {

						var image = new Image(), texture = new THREE.Texture(image);

						texture.mapping = new THREE.UVMapping();
						texture.format = THREE.RGBAFormat;
						texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
						texture.minFilter = texture.magFilter = THREE.NearestFilter;

						texture.needsUpdate = true;
						image.src = "data:image/png;base64," + obj[i].byteArray;

						material = new THREE.MeshBasicMaterial({ map: texture });
						var mesh = new THREE.Mesh(new THREE.CubeGeometry(4.5, 4.5, 4.5), material);
						mesh.material.side = THREE.DoubleSide;
						mesh.position.x = obj[i].rgbvalue.r*5;
						mesh.position.y = obj[i].rgbvalue.g*5;
						mesh.position.z = obj[i].rgbvalue.b*5;
						scene.add(mesh);

						objects.push(mesh);

					}
				}
			}
			//xhr.open('GET', 'http://campartex.cs.technik.fhnw.ch:8080/campartex/services/images/streams/values/rMin=150;WIDTH=161;HEIGHT=100', true);
			xhr.open('GET', 'http://campartex.cs.technik.fhnw.ch:8080/campartex/services/metadata/getImagesByArtist/artist=leonardo;width=10;height=10', true);
			xhr.responseType = 'json';
			xhr.send(null); 
			
			var imgData = JSON.decode('[{"metaDataImage":{"uid":"5257fb65e4b08f9531d297d8","url":"/var/lib/tomcat7/webapps/campartex/WEB-INF/artworks/art10.jpg","title":"art10","artist":"leonardo"},"byteArray":"/9j/4AAQSkZJRgABAgAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDpL+S4+13j3DvE9rNh1V2KNEUyCV3YABKEtjIxnIxgWImvDCh+x6fJlR85vSN3vxFWfLLIs95iRxtNpIMMeGadwzfUjqe9WrmaWK6mjjkdEVyqqrEAAHgAV5DnLmc4u1/82dLjGKUWrn//2Q=="},{"metaDataImage":{"uid":"5257fb65e4b08f9531d297dc","url":"/var/lib/tomcat7/webapps/campartex/WEB-INF/artworks/art2.jpg","title":"art2","artist":"leonardo"},"byteArray":"/9j/4AAQSkZJRgABAgAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwBulfEGLWtZ06xEs0b3NpIklyBk2zlmPzKoAc4VACoXhskknC5a/Hu9CgNoFoSByRK1eeeHyftMr5O9I49rdx++jHH4Ej6GscgZ6Cs4RSbHJLTQ/9k="},{"metaDataImage":{"uid":"5257fb65e4b08f9531d297e0","url":"/var/lib/tomcat7/webapps/campartex/WEB-INF/artworks/art8.jpg","title":"art8","artist":"leonardo"},"byteArray":"/9j/4AAQSkZJRgABAgAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwA1LxNF4c1eG11SSaaa6QyrIlskptYtymRcqyv5YCMclDnAPJQiut3V5P8AEGCGX4s6DHJEjxyi2EisoIcGZgQR344r1g9ayUbanu0JuU5rsz//2Q=="},{"metaDataImage":{"uid":"5257fb65e4b08f9531d297e4","url":"/var/lib/tomcat7/webapps/campartex/WEB-INF/artworks/art3.jpg","title":"art3","artist":"leonardo"},"byteArray":"/9j/4AAQSkZJRgABAgAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDJuNelt32GYIXY7WuJshkX+EDbweQcdOGAHHNd9f8AEMEjRJaRTIhKrI1sSXA4ySCBz9BXI6n/AK21b+LZcc9+Bj+XFPaWQMQJHAB9a4lRhFaI6ZV6k3dyP//Z"}]');
			console.log(imgData);
			var image = new Image();
			image.src = "data:image/png;base64," + imgData[0].byteArray;