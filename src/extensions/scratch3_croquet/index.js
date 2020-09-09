const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const Croquet = require('@croquet/croquet');

const convertBlock = require('./cps');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const iconURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAAAAXNSR0IArs4c6QAAActpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgSW1hZ2VSZWFkeTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KKS7NPQAAIKlJREFUeAHtnfuTHNV1x2/Pzu7sroTYNdg8HGDFI4YYF4sBY55aP+JIKmyE80OcchxEEucHV6qwk/ySH1Kg/AOByg/+JQlyJZVUJZVCdtmybEy0glTKVSZGxnHiYAwLlgBjzC4PS9rdmel8v+fc09Mz2pWme7pnenb7Snfus++9fe9nzzl9p7vHudKVM1DOQDkD5QyUM1DOQDkD5QyUM1DOQDkD5QyUM1DOQDkD5QyUM1DOQDkD5QyUM1DOQHYzEGTX1MZoaXH33Kxruqkuz2Zh+tD8Qpd1N1W1TQnW4s65ORc0Zl0QTLkw3OEcQudme1v5cF6OD4IjrhkuODdC6DRPCjbXx4YHCxDNONeYc5XKDkBEeHoEKDEgR3HEvHPhEVcbmZ8+ML+UuIUhPGBDgqUSqXk31mMP/EzB1uWoC9xXnascmD44T+g2pNswYIlt5ML7IZUI09SQrNYCxnnAhZWHN5qtNtRgLe6Zm3LLjb2wke7HAs3AD7GDjRa6r0wfenL/EJ9ENPShBEvspkr4wJBJp2jSzxJZgqp82I1VHhpme2yowIoBtfcsi7MRiocasKEAa5MB1flHMZSAFR6sxd13PgjbgzbUsBjknWBklV6C6v/SsNhghQXLbxk8glWZyWplNkg72K6o3Ff0rYrCgaVXes0HAMEXNwgI+ZxG4PZNH3ziwXwa773VQoFVSqnEC1pY6VVJfCo5HSC2VNA8jOZncupiIzY768Lm4cWdd+wt2skNXGKp6gthS8mOedHmZ3jGEwT7pw8eua8oAx4oWPI1TNikgT5blAkZ8nEcdbXKR4qwsTowsDxUVH2bfRsha5YXcNV4z6CvGgcCljfSHy2hypqpqD1sqkJyDfDuib4b72JoqpFeSqqIg8wjuIERRj3vhh2Q66vEUqgC2lSl688MDExy9Q0sb1M93Z/5LHuJzcBA4OqLKowZ6rHzLaN9moGBqMXcJZb/iuYFTGJpU/WJpHW6WcBWxPX92orIVWJ5qMothXVWus/ZM25ZvtnoS7e5guVWwr/GWQzsyqQvMzhcncwu7t7Rl4un3MCSK8Aw3Dtc874JRos16cd3i7nYWHLHZ9DkFWBpVxWTVdw0CHsrx6e485FYQbPcVS8mUDaqKTwJnqtKzBwsuf2ltKtsAQscBnOLu+74Yl4DzFQVliowr2XKrd3cVGK2EkvFa2lX5cZB5g3nphIzA0vuWHDBXOanXjaY8wxAJfLtOxm7zMBygdywl/Hwyub6MgM5rF0mYPl9kZm+TELZSR4zMJP13lYmYOEFZg/kcbZlm32cgYzXsGewNrq0amBtV0L1jG9gl6nUqvY8URmT3vN4UjbQADzL117n6pfMOPe+a1xj6zkuvPjX3OjoKB4gCvGUv8MbIEO3urrqwmMvuZG333LBs//rRhGfWPipq546mbLnAh2ma7k/ixH1tI8lVxN6m3EWY+l7G030eOKmW1zjgx9ylRtudrVazY1Wq9DsgYAEouQ/gWo2m7jbt+ka8EyHTc2r11fdysqyC55+ytV+8H239f9+NNyQhbhXPoN3p/YmsQK8QW8IXWNi0r2z4+Mu2PlJt+X8d7va2CheUVoRmOwvLfRSijAx3gwrgCvENyEN14THJ973VnHVgMeOuPDDt7sVwPnyG2+42vy33XnffdJVl08N3+zoms73OnCbx8Tt+HutFhMfOMADRELt+E0X3vM77pwLLnBjo1VXgXSCiMK7zuAY907AIlzeU2LRNwBXw8MlaZZLPsobrNNwdajLEwBs6xPfcefD92zI2qD6FYaV7b1+QZ1eYukrGvt1qj33s3LxJe7EvX/szr32A6LyKKGo8syzA8bpCJOFqvaIJB1VZAPlQIVAIWeEwFHaMVFhXsWNQJ1OnHeeW77rt93z13zAXfjoP7utr73KBobDBY09GOhDvQy2hz+m4N5eOu7nse/cdKtb/Yt97vzrb3ATExNuZKQKPyK+gjDyhA2eaQOOEo0Qqkcc6q9SAZDwUVlUB21JOeBCyD5qV1zljn/hz92rN97Sz1Pusa/e17Yl+xMMxX/Z/EKCQwZSlULk7c/+gZv8rbvcxOSkGxFACIVKK1GDqGOSygZpEsukVdxYb0DVURXW4UOoPtZlOVUgbbAG8kxV1ht1qdeo18XAr/7nk+6yQweGQzX2qA7TSSwVlbYOhQwJ1Vu/90duEgZ6CyoveShhvNozyWQhT8ZA418d45RCVs7j+A85IrW0HHFfh9JMJZr1pWEV6rF+y+3u+Z17aPYX3/W4xunAcu7uos/MW5/9Q7dt96fc+HhNJJWBER838+LOJJWFVsY0/2l1QmQe0+fjApPlUyIKYF5tUj3SQzU2br7VPfeJT4l9Zu0XM+xNHSYGS64GC34Xw9u77nZbdt4FGwd2DhZZFp92ETjqhImLKuCI9d1uuGt+PE8RYDticyFCoCC8RAJGeQKSwicSjsCZ+kW4fOPN7qe3fbSYPLVGNatr3cpIEksMFl7YP5ekg37XPfGB613tM7/vxvzelEoXrj1Wv8N1AsU0nYVt1aWM5ZRcpu4Ij6pJUivq1QD2IMnFAMGK+Sok1xL2vY5deU1bF4VL9LDWycFywY7CTYAfUB0bn83P/wm2E8Z08bGYXPC4lDJoLOSha8WZR5aoAo1J5klbbBdOJRS74DRqP5E95tMClMDWgpB5VVyZvnTnx9wJfHVUXJd+rVOAJb+gVci5OPG5z7ut2EnnQpsK4kAFEiJCgRNzCg/zW57FTMcdk/QGKLGK4vG+lGMpEw3poRa44qD5/Oo557r/vu1j8a4KFk+/1inAKuZdoqeufJ+r3XpHZMvYwneulEKiIHWWMW1QST2BkZAJVVJdIKHEIhzIYVTiElHg2vNUkjHPH8EDoivKE5dd7o6/9zJpu3gf6dc6EViDfN/S2Sb91F2fxnd+UIGoaNJCjgEhkUQiIF04QmXOQBIwPDzxMoWKqHioCA3qed4igAR0wmWejSDBTdQf33hblyOznvsXpl3zRGBhR3Cmf6fUfU8nr/h1NzH7QV1QLipXD87CeEvATNQa80w6xcsZ94cTkVhRPI46sTLGFSarg1AaadWKyn2+lLMaemhMT7uFS6+I9VWgaBO/RJvCJQMrCFJ1kmJciQ5Z/fgufKE8JscYFFEDHRmtpebaGwhR7SgvXiRQxKqudZwQwjrwUpWhRJjHCDPYDyHUqI2FFwEvbr+ShcVzlWAmzaCSgRUG16XpJM9j6u86z43gniqulq4fQ1nBqNvT01HRmpHO+q1Ka7TtC7VH/8mxSD5DH0eG5qEgpmqlGtJvXnCxe3tii2+tQIH8Znby8SQDyzWnkneR7xEnr52VuxVsIdlb57r1MgJD5GxtsE+OoVXfYxTR1GqhpY4lJiqZttZLF7y3VWnIYwnBKp4qDHFbClWJOCziGuvY3yWKBtCOd/yCgOTrBQWGJtVo94XupUu393esXfWW7sowIVjFenuMrMkHb9Lp8QvavpxdzdwZK1GmtJwC0ErHYlbNQkEciSjNYw0oiXi4fJvIWto2jbu9NoZLClahznoVN+/xHnVZMT8y8tV5tXd6Wit35tvJrZUfz1PpY6DwqIgexCxOePi/BY5maFrz9bYbth2GTbERfz51ng2jMGGa7wy7Bivtfkaes7My/S43ir0rOl1shlxNW9xYgdTi0mqZVWkHRhc93p7GY+1JO/E0j9HGGajg1DzrS9pQxGR8hIi3M/P+rSbjaID3dPGi4fUt27SxIn2eSv5Wxq7Bwk1EhTPcg0tn/HLp0kUrjKRKgTgAmqc1NT8CApF2wHRVCYa2Iw1qpo9afW1DarIDwdbaZcLGISFBIlCooDcPGmAa8smfZT5utgFc+nveC3DyvNfcm1ZYQfkfjUoW3i77/YJTIjBfQhzAK7gIguhIttMCUsp9JYWEFQkcPqN8ydKjkKf11gkBlj06Zg9oRNILZW9sKfKX0rFJOkt0uMHCA6W6tlhEQoO/+DBQKGQviouMCZA41x7pTrjWm58IIunAINE2WkBpPtvQXpnWB1vjcFHlsUBuX4bqM6BaoS8DWMt4lGwjuKEGKxyfkAUDLQJNCPFFFTOCNJ0BwLjkxCWWAMOSFniM2zFSrB+xPOKj8LTqebhQNw6TQB7lrQFT7N54u1/e7C2OY9jdUIMVTT4BIDkgi4tLAcHHT006teoRIqKhLi7JrA6bQiP8kCwDSKQO8ixUiPTuda2NT+lbjXEa6GJLiepTsPigBaUUH7bgQxkEik9Wy9PVCFm2UVz3xnsBz7jy3LMqJbDgZEEXmyEWF+M1KDQ/JlGoMglBPERcVRYXN1YXDcVhYpkdZ32iMXamBrm0a3CxrgLWwBM7IpkIFX1dQ3mqOgJt44A11BIrwCIKPFjXALYV15cfDGkQY0te0ia5RFpJXWHHA4RAYu2h5Pm20Ij0w3bjkEXAWrlIHdSVUCWQgAVwCBDjfGxMwLKQdSnJ4DnwC94aqofLddLW+BxqsMJfvCpqb0RAwgdvxCIMWKMmmKpg0cT+womL2kOZQRafC1OJzBNQJZRUBBThMqhaEgt9eaiYx8fvBSQBC3FTfXiuMIIJkopw1ZnnpZZKM4KFJ6s5+A3guger4vCG3WKd8ejiG25ldUVu8BOdjkXBIw3y3B6edtcQQxbzi+KGxrtPy5lQhMGZ1JOEgCK5ZFScqFbEIwlFeLWEmSKhWnYSH8FXwOThVoFqFWBBWiEuD7HiDTWEqaUSVbqx1YveXNJOh/yzaxtrkD8Du94c157/ibyvilLCFp0Gsy42Fxyei8zFN09pEotTbYmnXSbe6qIZgYz5bLLVB/OZSbjYVgsqVWlikFPViVQCTHUa7AzpNT+CzAOmvTl33om31jvdweWPu6NJO+8arKQN96M+Bx8uPC8qioupIMXAwaKL2ooBZlAxNG/wtdIeMlFtKn1QHSwpdMIVPgg0pY7aSN6OQh3mUTIRLL4/S9ISRxpvoqmvejXoIWO7VMdb8fK2CdQrmkvzU3RJwVoo2kmPPP09kSaEIoJLpJLCwb0h9QqFwBFJKc3jsQaNGN5Im60U5fs6IlnYJlSbqDKGsnWAPA+a2k8AKIJqFZKVUClozFeVSHVIm4pgVdwlsBkL6FLp5oRghQtFO/HJ/3nGnTx5UtSZwgXJwYX30iYCQ9Kmzih94CnJYl5h8nkxCYUcBY9SCgeKquMeFKCQqz0PF/MjqCCZVr2UYrgKmPiaSfE04AWyurRL24+P5F/16s+KNr0YT5hYDfIkkoEVVBZ4UJHc+CvHXRPvANVF9kBxwSk94O3KzHa1bSsgAs5LojXTBMqgapNShMqrPtnkVMgIjao6SitVhQLSikG1IuUNSiyWY3x0vFFx8uQJ9553CmhfuUoqidX9VaFMQfiiBAX7GD/8bbeKhxGqcmcA9tz5ECmuCeWiD/EAO/K0YdRj8Izz+x+9KETgrw4BkTmCRmcXAEyLRBNp2AJWpBdAFvUmYK14qQQphfSKSakVzSdQohYRonWRVLwt+ZqXfir9Fe4jCH+QZkzJwAopFv1qpOktp2POPfqUO4a3F09eOiOqpeLfrMenocNAAVOo+J4FngEh42Ak0T4q4YmqD8vupZnaYCoNTeKZuuVVXgSVV3cKD196C0lFoMRTmilsVItsk2MiVGOA7KrjL7aPoygpWfPkg0mmCsORVPo2+bCSHUFGtnzr67KATbnSgmqiquElP+0fvGvbDGu5QpOrNjW6W3WQ5rFSxqu6lpc6KGva3pPYUg2VTB6cOvbTRBWKRCJUK7LHRrj4VmVRiQIev9rhfhtV4Ijje7OuXnjO1VBWSBeMLKQZF88vkVvcdSe/c5hKdFAfKlPQvPSFP3O1q64Wm4V2i7zDAUZx9MYXL6FaEgsHxWeAUopjpaSSACEgEDVo0gtpA03spIbaSxKPoFKwKKmWARUhW/WAUcKxdY6P75DfgguPTz7+tbZhcAgFcUvT33xiOs1Ykkks6SHdVUKawSU5hny8+9/+Sa4QdROS0oeX9+rlCi2SOCqNDBCRVFhw+R6P9SnpEMo+lEkulKshDkkkoFAKwTPujXbmLy9rOaUUobJyfkPAdgUq2H2j1VGRVjcf/W5RocKMpl/rZDYWVzoIjmB25hgtmpv4+Stu4tDX3Cm8eI2GfAVfGMpbZyq0swLXhGeID11MCyWl4ooLD+GkUouGOhJitItKhTqUbQaFTsAkeCKpvP1ElRhTf2K8AzjCy4b5mqMqXgM+ivd3bX/ux+49v3ytaNPYGg/XOqVLDlazMo+fkHsgZX+5HCYcoGVevE8fecwde/eFLrzhQ3ibH95+DJWjcClUYsRzFBFUGrerQFGDaFC2J2SPC9IL6k/hot3Wss24h9UOFbcVCBalmF0VKlRsn2OhTcWXl0y//pq79pnvuYYfB1VHXCtziAN3XOuULtW5wM7iWg7cxYHiwvH3cPhc3srYuDuOtyWPX36lvmobC0qQ5MFWnLHdKS/Sy5+FgcWQniDpLrxB5UORWN7I95KKV4WiJv3WAveyDCxKNVN/hGoML4Xbgi+abzx8CF/frDjeiMybMgi/wZVqUbJfjdT2FYeSXGLJCQQHINf3ZH8u3bcYh6pBEJDBnSF83+vq+M7t3H/4W/eL393rJgUulVoQGe2qMN4dgUJawbIdeuSZtDKjHaAQFt1m8F/ReOmkgGkewSKcdHr1h3e+47d6JgHVNY8fdCFgXIGMqoKmKjqW3j1cPGbgcAVc4/QuHVhh86tYoYGBRQC4ZAwJlUgqJFbh60ivwNdxtTXxj3/v3vzMvYDrcpFWoga96olLK04f21I1iCUmZPCi/jxYsrMPaSUXBgSLFwaAh7vo9tVN67tAvXWGdBAqPlRLSTWG23wu+fY3XBOSahnj4B5t2NRQFwKj8OMz6cVhDcQ1m0d66TcdWG5kXpe2l67THUsAzEdQIU+gQgmhWoVfhidcwd992S3iDcqTN30Y9k3rFyei3rGQnqoIKIEqDhbsKjXaW9LqtDsXAJlcTYqU8jvq3KfCRQS3FWo/e9Gd/x+HXQM22DJ132nO8vRhEAEddSz3tOp5Z4yP9CSxUo97cdcdh3Hac3mfX7x9A4rSSr4MRgZtqlWqP9CxCn1IsOSHKxFfxlXdsoSIX/1+N/6JXW5i27nt6hAzQJAIF9WRfYWjO+sASqDyYOHKzm7Q0y0JNd4lD0CxHdkjAzh8eS2v/ALYYaPff8ptxZflNUBcQ9kYwjHYfTX0PSpx1MeRohZxPiPIH6jNFQT7pw8euS8+90njKSUWugndVzAXc0k77LW+wUUWCBjVIJY0MtwJGtWhesa9/9EP3S9fXHCjOz7qzvmN98tXKZQHIrDYGBzBMB9Xg4zTrpIHH3zcdulZJmDieP2RAL3y41c19VdedvX5f3fhr95xJwAUf9sJex409XALMsaIzplFyYti/LFwSwSjwnBkXChDsv+Opk6PLvW4+/2zclx6epNWcWMdv3kq0ooqkNKKanAFCx5JKy+1ToLCXyHeuOhit+3Dt7ht27fLloTKqnaw9IowZmf5bQaDyyQbV572GqEagarllefJ48fdO//1lKsArC1Ij0MEjYMckVioJ1LL0iDLJBnkmxsldDjPAUqtBey2b++Rq7RXhdgvOjC/tLh7x378ue7tdRBpjjfQGNJZmuCt5QREVAJzbvX4MXf8X//FHcPbALddd53bdsWVbmxyQtRPS2LxShPSCIBG0gsHm3RiH/oLYLjiBCQNbIq+8ZNn3VvPPOMC/hgm8sbgeaXKvs1plJ+QYPikxOW3hJRSTMsHYKUkG4gLoIkycOlVoXQePIyZ2JvBODJrAmvS5pgWKYeQAOC3UF0V+mYUK7n8y9fdLx7/jjv22GOueuGFrgZJtvVi+IsuEilEm4uSiKsti84YKaGeQs7bL7/iTr3+ujvxyivu5MKCgESYxlFe9R5JcXIYmtIkLbG1Hfupy+Uixo36XCBKr/Xqr91K6twlnMRDqY+OHdjzePtlxHPC6U0V8i892rdCCQ13XhnaVeEK0oyfQKiqEaHPszIL9Vitzzq0z/CbKa6G1yQRKfZLR0iIxClIpAC763yUv4pMGuAEaRTlapircS6GOfJNelHlTaK+1dFywIN8AkkDnqqQG7gClMRVeqEKcn1cRpPDRwZGu42qR4mFZgZkxHOSZaLxwUe99CoKl+rIJ3Ty/gYAwpAvBqIQoH4Rw5hRHoOQzyQSCEqJGupPoIB2Gq/6mvjahYchKY5xer6CtgJ7Sm0hhaqKAoHLg0Zo6AnVKKFBXN8poSGlkEgiyW9Bw46sH8bjjuPgxQnh1jq8Cs3QNYN9WbWWybjwFc8LGNBMVoNarx1OrKk1eUAU6eiqD8tfh7Sh1KIxf0riNOJjksxLIxr5tpnKuF1B2r4YrzKlHZTR6SaCxjlhlCjgQcAi0AqNgsU4IROwYpBRSpmEImg05gm8wci/cJYjWyQXoWMc/+UPAEWRU6w0SUuNRbHiqF6iSIbSiv32LrHYShjuw0w/wmjeziaRE03pw8mn5CAD8iojTHQDNhQXVxzVCYAiAKxHyVRF5VEBStP8No+AxsFie4RY8rUlXUD2izS9tIkItl1F+jCMSy5OroAmEFFyAR7UIUD8R3gEStSjNOM5EVpKUsbxXz0j3sWiKMMg4fRTK8TLNaerzyXsc+zrqmaXlVKO4/TWIbWeRu7s6SXZ5nASueAMCQKYEfUgNhfSlDS0k9QGa0mj9r2tGEhoiXUJF9syG876YEcCmO8XARZUF9+gZiiSC2UERIBBHdpfEVzIp8pViaaQ064aQx6PIZCEStUr22N6LbBQ4J2BxWQrVws70/6QtYPA7Zs++MSDaxemy81GYrHvsPIl3E5zON0wkh1lk8bFFMSw+JxZKgWqsTGsrGw6QjpV4LkZyS966yhnvkonwqRpgsXjFCwa61gy5LFZenOMa110h/648C21qEAJWMgnKBFkBAdtGkAEz+pZHYOKQLFt/I88omd0rNvpbNxrlXXU5eVsJleC8Xa76Dde/czxxV07HsVS7Dlzrd5LbcEZRhIGCe4HifRBnBJI4wgtP8rDcSDHpBTL5YY+hNImyhjS80NCRGWy/IwxjzvldCpdDCwFzoBRgHyZwEWo4H1cVCfjvh2WsVWTVpJgJ3Dam33aqCxf66z3qUetVRreM/3NJw+sVdJLXnYSi6MIA0itcA6xKSbzcvFJUntEcyiVZJFhfI1g0QldA0WiLpHXQJ5AhDyVPKgDiBROVSyMyxaDX7fW8unZWN8qVagUtV2WmvqiJGWc8EiIdAQO8ghPVI7jRP3hRNh23LPNdsfSLF1wALvsmUPFEWY9Ure4+84HMdcPZHn6Z2qLC09PYBiKOkNEYEFOK60AKVCm9rQ+QRKgcBzbiHtNITNyhKkdAEJGVUZn7ShkBpaWK2Q+jrqiSnksPOFiC/TMjxwzvNOeNWH2VazYqp0WrlNnCXsh29O8l+G0DtbIWKfPNWomyOqXIW9DIggqaWJQIFNtJuYpOEzTdhJ7yo6RtNZhGf5H3tpfK+TERR4RM+gVMj2C/ZnBRFgowXiMAWVARnnSs7YrLbDAO43aJxtWF6tiWaeFa9YZCT49/fUjMF3ycdmqQhtjWLkHhjyvEnNVidYdQy5WHAqaP5QECpIa47xzgG9VFuOc9XGA5CGUPClja0yrl0THBxeKnk7jXoohwXEQGM1nqGXWHsfFHNajk/oaPcsnW8zGBbXxL5/76Le+KQPNpsnTWslutB1NL+68Yy8G/khHdi5JLlqns7xoQVFB4viQMlClgDFsQRTFpVJnq7G0AKIAMdcmUq4SfQbz2iFjgTrpB5RZf4xJfavA0BqVaCvRkxqsVn849bXHb0eTq7gr4yS7ycPZH07mbU8fenI/ZnV/5g132aAtEk+QXgxkhLqBiTTEmdxYxxCVZaccFOjuuO4vcd8pnq9xfh+o3wnGy6QN3+YIOoz68X3bOCzkeKqQkPwynF4MeuRx3OKiSCwPBQaVr5UsCII3R2+67XM4iJYDv2rNzeWjCm24Y7hKXJZfQp+1rKzDswkW9mdrZCHz7DgJKVa8s/y4mrA8rdWqy0NaqfbSVr61vH7IulIfH/Hj2K/2rbk2jvVbOnNJdfaGe7b85V+9gForkFa5PtMfP48zjypl6eLOuZl+21sphxrBlvT43CexywF1gtc2riD406lvzP8NgMpVUtlQKZlzddOH5hdwR9xH0MlSrh1l0DgXIo3PoOtMmugce1ujzeDpfkHFfnMHi53Ii3HD8EuMl25zzEBfwOJUijEfhvdtjmktz7JvYJVwbS7Y+gpWCdfmgavvYEVwufAexAtv0G8eFLI904GAJXDxVo0huVrMdso3R2sDA0vgOjh/FDcIXo/40c0x3ZvnLAcKlsDFfa4a9rkG+PXP5lnu/p3pwMESuPBUtbyEQrcjSrurf+ufW0+FAMvOTve6qBrDecsrw+GcgUKBxSnkV0C4B/sjgIs79aX0Gk6u+vOVTpq5AVwP8dbZ0vZKM3uDP6ZwEis+JbwfW20vfoldqsf43BQ9XmiwbPKgHudFPYYlYDYnRQ+HAiybxBIwm4nih0MFlk1nDLDtyHsIvjTybXIKEgYFGUfPw9CHNyp3wxbb03NjG7EBmBH8g+zXqW0YsGzC5N2opxp78Pq+HXi+i5BNWdmmDkuwsl3+xd1zsy5szOFm2R2QZrNofSbbHs7Y2hJudp7HQzFHEF6GmgR9Br7/rgQr3zmXhzu4uJXmnCx22JxBCN/rgnM7BL+fzJ+65a+S4kdDoXoW0G6bw6s19+CujrtRZ29bQd6JEqy8Z/jM7QO8uTPXaCtdWAuethrrJPR15o29gPp+VJlZp1p22SVY2c3lsLQkMFfCe3OVYn0Gayi3G4YFmG7HKdsn/ImRWmUacN2H4452e2xR6wVFHdhmH5dcdLjwfoBGg3+q5/koJVbPU7ghGuCzmPI9Kb+I1zs9FobpxEqJNUSr1ZMtVkqsIVrpPg81ssVC3k7k9qH7hT4PoevuSonV9VQVs6J+leXuxbbF3BlHWEqsM05PWdgxA7ydW24pCnBLd4EeSCm3GzoWaliTMWN/2qvJpbZzqfT3DpBSFbbN/sZKiJqsBDPYsjgKqXZgY51deTblDJQzUM5AOQPlDJQzUM7A5puB/wdqlaS416ALQgAAAABJRU5ErkJggg==';

class ScratchCode extends Croquet.Model {
    init () {
        this.$functions = {};
        this.$vars = {};
    }

    setModel (model) {
        this.scratchModel = model;
        return this;
    }

    addCode (functions) {
        const keys = Object.keys(functions);
        keys.forEach(k => {
            const f = functions[k];
            const func = new Function('Cast', f);
            this.$functions[k] = func;
        });
    }

    invoke (name) {
        const func = this.$functions[name];
        if (!func) {
            console.log(`function named ${name} not found`);
            return;
        }
        func.call(this, Cast);
    }

    futureInvoke (name) {
        this.future(1).invoke(name);
    }
    
    log () {
        console.log(17);
    }

    addOp (a, b) {
        return Cast.toNumber(a) + Cast.toNumber(b);
    }

    minusOp (a, b) {
        return Cast.toNumber(a) - Cast.toNumber(b);
    }

    mulOp (a, b) {
        return Cast.toNumber(a) * Cast.toNumber(b);
    }

    divOp (a, b) {
        return Cast.toNumber(a) / Cast.toNumber(b);
    }
    
    equalsOp (a, b) {
        return Cast.compare(a, b) === 0;
    }

    ltOp (a, b) {
        return Cast.compare(a, b) < 0;
    }

    gtOp (a, b) {
        return Cast.compare(a, b) > 0;
    }
    
    joinOp (a, b) {
        return [a, b].join('');
    }

    letterOfOp (a, b) {
        const index = Cast.toNumber(a) - 1;
        const str = Cast.toString(b);
        if (index < 0 || index >= str.length) {
            return '';
        }
        return str.charAt(index);
    }

    containsOp (a, b) {
        const aStr = Cast.toString(a);
        const bStr = Cast.toString(b);

        const format = function (string) {
            return Cast.toString(string).toLowerCase();
        };
        return format(aStr).includes(format(bStr));
    }

    lengthOp (str) {
        return Cast.toString(str).length;
    }

    modOp (a, b) {
        const n = Cast.toNumber(a);
        const modulus = Cast.toNumber(b);
        let result = n % modulus;
        // Scratch mod uses floored division instead of truncated division.
        if (result / modulus < 0) result += modulus;
        return result;
    }

    roundOp (a) {
        return Math.round(Cast.toNumber(a));
    }

    mathOp (op, arg) {
        const operator = Cast.toString(op).toLowerCase();
        const n = Cast.toNumber(arg);

        const tan = angle => {
            angle = angle % 360;
            switch (angle) {
            case -270:
            case 90:
                return Infinity;
            case -90:
            case 270:
                return -Infinity;
            default:
                return parseFloat(Math.tan((Math.PI * angle) / 180).toFixed(10));
            }
        };
        
        switch (operator) {
        case 'abs': return Math.abs(n);
        case 'floor': return Math.floor(n);
        case 'ceiling': return Math.ceil(n);
        case 'sqrt': return Math.sqrt(n);
        case 'sin': return parseFloat(Math.sin((Math.PI * n) / 180).toFixed(10));
        case 'cos': return parseFloat(Math.cos((Math.PI * n) / 180).toFixed(10));
        case 'tan': return tan(n);
        case 'asin': return (Math.asin(n) * 180) / Math.PI;
        case 'acos': return (Math.acos(n) * 180) / Math.PI;
        case 'atan': return (Math.atan(n) * 180) / Math.PI;
        case 'ln': return Math.log(n);
        case 'log': return Math.log(n) / Math.LN10;
        case 'e ^': return Math.exp(n);
        case '10 ^': return Math.pow(10, n);
        }
        return 0;
    }

    randomOp (a, b) {
        const nFrom = Cast.toNumber(a);
        const nTo = Cast.toNumber(b);
        const low = nFrom <= nTo ? nFrom : nTo;
        const high = nFrom <= nTo ? nTo : nFrom;
        if (low === high) return low;
        // If both arguments are ints, truncate the result to an int.
        if (Cast.isInt(a) && Cast.isInt(b)) {
            return low + Math.floor(Math.random() * ((high + 1) - low));
        }
        return (Math.random() * (high - low)) + low;
    }

    setValue (info) {
        // info is {name, value}
        this.scratchModel.setValue(info);
    }

    getValue (name) {
        return this.scratchModel.getValue(name);
    }
}

ScratchCode.register();
        
class ScratchModel extends Croquet.Model {
    init () {
        this.resetCode();
        this.subscribe(this.id, 'setValue', 'setValue');
        this.subscribe(this.id, 'resetCode', 'resetCode');
        this.subscribe(this.id, 'addCode', 'addCode');
    }

    setValue ({name, value}) {
        this.values[name] = value;
        this.publish(this.id, 'newValue', {name, value});
    }

    getValue (name) {
        return this.values[name];
    }

    resetCode () {
        this.values = {};
        if (this.code) {
            this.code.destroy();
        }
        this.code = ScratchCode.create().setModel(this);
    }

    addCode (info) {
        // call to this should be always preceeded by resetCode()
        const {functions, entryPoint} = info;
        this.code.addCode(functions);
        this.code.invoke(entryPoint);
    }
}

ScratchModel.register();

class ScratchView extends Croquet.View {
    constructor (model) {
        super(model);
        this.model = model;
        this.subscribe(this.model.id, 'newValue', this.newValue);
        this.cache = {};
        this.changed = {};
    }

    setValue (name, value) {
        this.publish(this.model.id, 'setValue', {name, value});
    }

    getValue (name) {
        return this.model.getValue(name) || 0;
    }

    newValue ({name, value}) {
        this.changed[name] ||= this.cache[name] !== value;
        this.cache[name] = value;
    }
}

/**
 * Scratch 3.0 blocks to interact with Croquet.
 */
class Scratch3CroquetBlocks {

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'croquet';
    }

    /**
     * @return {number} - the tilt sensor counts as "tilted" if its tilt angle meets or exceeds this threshold.
     */

    /**
     * Construct a set of WeDo 2.0 blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3CroquetBlocks.EXTENSION_ID,
            name: 'Croquet',
            blockIconURI: iconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'start',
                    text: formatMessage({
                        id: 'Croquet.start',
                        default: 'start [SESSION]',
                        description: 'start a session with the given name'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        SESSION: {
                            type: ArgumentType.STRING,
                            defaultValue: 'croquet'
                        }
                    }
                },
                {
                    opcode: 'setValue',
                    text: formatMessage({
                        id: 'Croquet.setValue',
                        default: 'set [NAME] to [VALUE]',
                        description: 'set a value of the variable'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'x'
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 42
                        }
                    }
                },
                {
                    opcode: 'executeModelCode',
                    text: formatMessage({
                        id: 'Croquet.executeModelCode',
                        default: 'execute model code',
                        description: 'search for all modelCode hat blocks and create model side expanders'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                    }
                },
                {
                    opcode: 'getValue',
                    text: formatMessage({
                        id: 'Croquet.getValue',
                        default: 'get [NAME]',
                        description: 'turn a motor off'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'x'
                        }
                    }
                },
                {
                    opcode: 'whenValue',
                    text: formatMessage({
                        id: 'Croquet.whenValue',
                        default: 'when [NAME] changed',
                        description: 'receives the change notification'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'x'
                        }
                    }
                },
                {
                    opcode: 'modelCode',
                    text: formatMessage({
                        id: 'Croquet.modelCode',
                        default: 'model code',
                        description: 'Code that is executed in the model'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                    }
                }
            ],
            menus: {
                NAME: {
                    acceptReporters: true,
                    items: []

                }
            }
        };
    }

    /**
     * Start a Croquet session with the name
     * @param {object} args - the block's arguments.
     * @property {string} NAME - the name of the session
     * @return {Promise} - a promise which will resolve at the end of the duration.
     */
    start (args) {
        if (this.creatingSession) return Promise.resolve(null);

        const createSession = () => {
            this.creatingSession = true;
            this.sessionName = args.SESSION;
            const promise = Croquet.Session.join(this.sessionName, ScratchModel, ScratchView, {tps: 30})
                .then(session => {
                    this.model = session.model;
                    this.view = session.view;
                    console.log(session.id);
                    this.sessionId = session.id;
                    this.creatingSession = false;
                    return `session ${args.SESSION} started`;
                });
            return promise;
        };
        
        if (this.sessionName) {
            if (args.SESSION !== this.sessionName) {
                console.log('leaving: ', this.sessionId);
                return Croquet.Session.leave(this.sessionId).then(createSession);
            }
            return Promise.resolve(`session ${args.SESSION} continues`);
        }
        return createSession();
    }

    /**
     * Set a value of a property
     * @param {object} args - the block's arguments.
     * @property {string} NAME - the name of the property
     * @property {number} VALUE - the new value of the property
     * @return {number} - a promise which will resolve to the VALUE
     */
    setValue (args) {
        if (!this.view) {
            return Promise.resolve(null);
        }
        this.view.setValue(args.NAME, args.VALUE);
        return Promise.resolve(args.VALUE);
        // it returns a promise so that the Scratch execution engine yields.
    }

    /**
     * Get a value of property
     * @param {object} args - the block's arguments.
     * @property {string} NAME - the name of the property
     * @return {number} - The VALUE
     */
    getValue (args) {
        if (!this.view) {
            return null;
        }
        return this.view.getValue(args.NAME);
    }

    /**
     * A hat block to receive a value change
     * @param {object} args - the block's arguments.
     * @return {boolean} - whether the hat block should fire or not
     */
    whenValue (args) {
        if (!this.view) {
            return false;
        }
        const name = args.NAME;
        if (this.view.changed[name]) {
            this.view.changed[name] = false;
            return true;
        }
        return false;
    }

    modelCode () {
        // no op, but the block 'execute model code' will look for all blocks with
        // this hat block and send it to the model.
        return false;
    }

    executeModelCode () {
        const that = this;
        if (that.view) {
            that.view.publish(that.view.model.id, 'resetCode');
        }
        that.runtime.targets.forEach(t => {
            const keys = Object.keys(t.blocks._scripts);
            keys.forEach(k => {
                const id = t.blocks._scripts[k];
                const block = t.blocks._blocks[id];
                if (block.opcode !== 'croquet_modelCode') return;
                const result = convertBlock(block, t.blocks._blocks);
                if (that.view && result.entryPoint) {
                    that.view.publish(that.view.model.id, 'addCode', result);
                } else {
                    console.log('result', result);
                }
            });
        });
    }
}

module.exports = Scratch3CroquetBlocks;
