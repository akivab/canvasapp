from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.ext.webapp import template
import simplejson as json
import re
import urllib2


class Image(db.Model):
  name = db.StringProperty()
  image = db.StringProperty()

class PostImage(webapp.RequestHandler):
  def get(self):
    name = self.request.get('name')
    data = self.request.get('data')
    callback = self.request.get('callback')
    if data and re.match("data:image", data):
      img = Image(name=name,data=data)
      img.put()
      self.response.out.write("%s('%s added!')" % (callback, name))
    else:
      self.response.out.write("errorHandling('Error adding %s.')" % (callback, name))

class GetImage(webapp.RequestHandler):
  def get(self):
    name = self.request.get('name')
    callback = self.request.get('callback')
    data = Image.gql("WHERE name=:1", name).get()
    if data:
      self.response.out.write("%s(
    if not name or not Image.gql("WHERE name

class MainPage(webapp.RequestHandler):
  def get(self):
    path = os.path.join(os.path.dirname(__file__), 'index.html')
    url = self.request.get('url')
    tv = {'url':url} if url else {}
    self.response.out.write(template.render(path, tv))

app = webapp.WSGIApplication([('/touch', AddData),
                              ('/show', GetData),
                              ('/*', MainPage)],
                             debug=True)
def main():
  run_wsgi_app(app)

if __name__ == "__main__":
  main()
