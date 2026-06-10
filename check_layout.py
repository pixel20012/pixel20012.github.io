from html5lib import parse

pages = [
    'index.html',
    'archive.html',
    'guestbook.html',
    'yearbook.html',
    'licensure.html',
    'not_found.html',
]
includes = [
    'layout/background.html',
    'layout/site-header.html',
    'layout/archive-rail.html',
    'layout/footer.html',
]

def load(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def inject(html):
    for inc in includes:
        target = f'<div data-include="{inc}"></div>'
        html = html.replace(target, f'<div data-include="{inc}">{load(inc)}</div>')
    return html

for page in pages:
    html = inject(load(page))
    print('PAGE', page)
    print('header count:', html.count('<header class="site-header">'))
    print('footer count:', html.count('<footer class="site-footer">'))
    print('archive count:', html.count('<aside class="archive-rail" aria-label="Archive status">'))
    try:
        parse(html)
        print('parsed ok')
    except Exception as e:
        print('PARSE ERROR', e)
    print('---')
